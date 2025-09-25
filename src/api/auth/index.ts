import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";

// Auth API
const AuthAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false, // Don't send cookies for API requests
    timeout: 30000, // 30 second timeout for all requests
});

// Request interceptor to add token dynamically
AuthAPI.interceptors.request.use(
    (config) => {
        // Don't add Authorization header for login/register requests
        if (config.url && (config.url.includes('/login') || config.url.includes('/register'))) {
        } else {
            // Get token from Redux store if available
            const token = getTokenFromStore();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Handle FormData properly - don't set Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle unauthorized responses
AuthAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is expired or invalid, clear authentication
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Clear Redux persist state
            localStorage.removeItem('persist:auth');

            // Don't redirect here - let the components handle navigation
            // This prevents conflicts with React Router navigation
            console.warn('Authentication failed - token expired or invalid');
        } else if (error.response?.status === 403) {
            // Forbidden - user doesn't have permission
            console.warn('Access forbidden - user may not have required permissions');
        } else if (error.response?.status === 404) {
            // Not found
            console.warn('Resource not found');
        } else if (error.response?.status === 429) {
            // Rate limited - provide specific message for auth endpoints
            const isAuthEndpoint = error.config?.url?.includes('/login') || error.config?.url?.includes('/register');
            if (isAuthEndpoint) {
                const retryAfter = error.response?.data?.retry_after || 60;
                const minutes = Math.ceil(retryAfter / 60);
                
                if (error.config?.url?.includes('/register')) {
                    error.message = `Muitas tentativas de registro. Tente novamente em ${minutes} minuto(s).`;
                } else {
                    error.message = `Muitas tentativas de login. Tente novamente em ${minutes} minuto(s).`;
                }
            }
            console.warn('Rate limited:', error.message);
        } else if (error.response?.status >= 500) {
            // Server error
            console.error('Server error:', error.response?.status, error.response?.statusText);
        }
        return Promise.reject(error);
    }
);

// Helper function to get token from Redux store
function getTokenFromStore(): string | null {
    try {
        // First try to get from localStorage directly (as stored by authSlice)
        const directToken = localStorage.getItem('token');
        if (directToken) {
            return directToken;
        }

        // Fallback to Redux persist state
        const persistedState = localStorage.getItem('persist:auth');
        if (persistedState) {
            const parsedState = JSON.parse(persistedState);
            const token = JSON.parse(parsedState.token || 'null');
            return token;
        }
        return null;
    } catch (error) {
        console.error('Error getting token from store:', error);
        return null;
    }
}

// Retry utility for failed requests
const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 2, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error: any) {
            // Don't retry on client errors (4xx) or if it's the last attempt
            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw error;
            }
            if (i === maxRetries - 1) {
                throw error;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
};

// Signup Function
export const signup = async (data: any) => {
    const response = await retryRequest(() => AuthAPI.post("/api/register", data));
    return response.data;
};


// Health check function to test backend connectivity
export const healthCheck = async () => {
    try {
        const response = await AuthAPI.get("/api/health");
        return response.data;
    } catch (error: any) {
        throw error;
    }
};



// Signin Function
export const signin = async (data: any) => {
    try {
        const response = await retryRequest(() => AuthAPI.post("/api/login", data, {
            headers: {
                'Content-Type': 'application/json',
            }
        }));
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Profile Update Function
export const profileUpdate = async (data: any) => {
    try {
        const isFormData = data instanceof FormData;

        const config = {
            headers: {
                "Content-Type": isFormData ? "multipart/form-data" : "application/json",
            },
        };

        // For FormData, let the browser set the Content-Type with boundary
        if (isFormData) {
            delete config.headers["Content-Type"];
        }

        const response = await AuthAPI.put("/api/profile", data, config);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Falha ao atualizar perfil');
        }
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get Profile Function
export const getProfile = async () => {
    try {
        // Add cache-busting parameter to force fresh data
        const timestamp = Date.now();
        const response = await AuthAPI.get(`/api/profile?t=${timestamp}`);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Falha ao buscar perfil');
        }
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get User Function - Comprehensive user data for profile editing
export const getUser = async (userId?: string) => {
    try {
        const endpoint = userId ? `/api/users/${userId}` : "/api/user";
        const response = await AuthAPI.get(endpoint);
        // Ensure consistent response format
        if (response.data.success === false) {
            throw new Error(response.data.message || 'Falha ao buscar dados do usuário');
        }

        return {
            success: true,
            user: response.data.user || response.data,
            message: response.data.message || 'User data retrieved successfully'
        };
    } catch (error: any) {
        throw error;
    }
};

// Forgot Password Function
export const forgotPassword = async (data: any) => {
    const response = await AuthAPI.post("/forgot-password", data);
    return response.data;
};

// Update Password Function
export const updatePassword = async (user_id: string, newPassword: string, currentPassword: string) => {
    const response = await AuthAPI.put("/api/update-password", {
        user_id,
        current_password: currentPassword,
        new_password: newPassword
    });
    return response.data;
};
// Logout Function
export const logout = async () => {
    const response = await AuthAPI.post("/api/logout");
};

