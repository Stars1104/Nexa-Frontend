import { persistor } from "@/store";
import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";


const AuthAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false, 
    timeout: 30000, 
});


AuthAPI.interceptors.request.use(
    (config) => {
        
        if (config.url && (config.url.includes('/login') || config.url.includes('/register'))) {
        } else {
            
            const token = getTokenFromStore();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


AuthAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            
            localStorage.removeItem('persist:auth');

            
            
            console.warn('Authentication failed - token expired or invalid');
        } else if (error.response?.status === 403) {
            
            console.warn('Access forbidden - user may not have required permissions');
        } else if (error.response?.status === 404) {
            
            console.warn('Resource not found');
        } else if (error.response?.status === 429) {
            
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
            
            console.error('Server error:', error.response?.status, error.response?.statusText);
        }
        return Promise.reject(error);
    }
);


function getTokenFromStore(): string | null {
    try {
        
        const directToken = localStorage.getItem('token');
        if (directToken) {
            return directToken;
        }

        
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


const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 2, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error: any) {
            
            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw error;
            }
            if (i === maxRetries - 1) {
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
};


export const signup = async (data: any) => {
    const response = await retryRequest(() => AuthAPI.post("/api/register", data));
    return response.data;
};



export const healthCheck = async () => {
    try {
        const response = await AuthAPI.get("/api/health");
        return response.data;
    } catch (error: any) {
        throw error;
    }
};




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


export const profileUpdate = async (data: any) => {
    try {
        const isFormData = data instanceof FormData;

        const config = {
            headers: {
                "Content-Type": isFormData ? "multipart/form-data" : "application/json",
            },
        };

        
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


export const getProfile = async () => {
    try {
        
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


export const getUser = async (userId?: string) => {
    try {
        const endpoint = userId ? `/api/users/${userId}` : "/api/user";
        const response = await AuthAPI.get(endpoint);
        
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


export const forgotPassword = async (data: any) => {
    const response = await AuthAPI.post("/api/forgot-password", data);
    return response.data;
};


export const resetPassword = async (data: { token: string; email: string; password: string; password_confirmation: string }) => {
    try {
        const response = await AuthAPI.post("/api/reset-password", data);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const updatePassword = async (user_id: string, newPassword: string, currentPassword: string) => {
    const response = await AuthAPI.put("/api/update-password", {
        user_id,
        current_password: currentPassword,
        new_password: newPassword
    });
    return response.data;
};

export const logout = async () => {
    const response = await AuthAPI.post("/api/logout");
    localStorage.clear();
    persistor.purge();
};


export const deleteAvatar = async () => {
    const response = await AuthAPI.delete("/api/profile/avatar");
    return response.data;
};


export const uploadAvatarOnly = async (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    
    const response = await AuthAPI.post('/api/profile/avatar', fd);
    return response.data;
};


export const uploadAvatarBase64 = async (base64: string) => {
    const response = await AuthAPI.post('/api/profile/avatar-base64', {
        avatar_base64: base64,
    }, {
        headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
};

