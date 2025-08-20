import axios from 'axios';

// Utility function to handle authentication failures
const handleAuthFailure = () => {
    
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('persist:auth');
    localStorage.removeItem('persist:root');
    
    // Redirect to login page if not already there
    if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
    }
};

// Create axios instance with base configuration
export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api`,
    timeout: 30000, // Increased timeout to 30 seconds for payment processing
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Create a separate client for payment requests with longer timeout
export const paymentClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api`,
    timeout: 60000, // 60 seconds for payment processing
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Function to create an authenticated API client instance
export const createAuthenticatedClient = (token: string) => {
    
    const client = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api`,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    // Add request interceptor for debugging
    client.interceptors.request.use((config) => {
        return config;
    });

    // Add response interceptor for error handling
    client.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            console.error('API Client: Response error:', error.response?.status, error.response?.data);
            
            // Handle 401 Unauthorized - Token expired or invalid
            if (error.response?.status === 401) {
                handleAuthFailure();
                
                // Set a custom error message
                error.message = 'Sessão expirada. Por favor, faça login novamente.';
            }

            // Handle 403 Premium Required
            if (error.response?.status === 403 && error.response?.data?.error === 'premium_required') {
                // Let the PremiumAccessGuard handle this
            }

            // Handle 419 CSRF Token Mismatch with retry
            if (error.response?.status === 419) {
                try {
                    await client.get('/user');
                    const originalRequest = error.config;
                    return client.request(originalRequest);
                } catch (refreshError) {
                    error.message = 'Sessão expirada. Por favor, atualize a página e tente novamente.';
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
};

// Request interceptor to add auth token from localStorage (fallback)
const addAuthToken = (config: any) => {
    // First try to get token from Redux store (if available)
    let token = null;
    
    // Try to get token from Redux store first
    try {
        // Access Redux store directly if possible
        const reduxState = JSON.parse(localStorage.getItem('persist:root') || '{}');
        const authState = JSON.parse(reduxState.auth || '{}');
        if (authState.token) {
            token = JSON.parse(authState.token);
        }
    } catch (e) {
    }
    
    // Fallback to localStorage if Redux state doesn't have token
    if (!token) {
        token = localStorage.getItem('token');
    }
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
    }
    return config;
};

apiClient.interceptors.request.use(addAuthToken, (error) => {
    return Promise.reject(error);
});

paymentClient.interceptors.request.use(addAuthToken, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle errors
const handleResponse = (response: any) => {
    return response;
};

const handleError = async (error: any) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {           
        handleAuthFailure();
        
        // Set a custom error message
        error.message = 'Sessão expirada. Por favor, faça login novamente.';
    }

    // Handle 403 Premium Required
    if (error.response?.status === 403 && error.response?.data?.error === 'premium_required') {
        // Let the PremiumAccessGuard handle this
    }

    // Handle 419 CSRF Token Mismatch with retry
    if (error.response?.status === 419) {
        // Try to refresh the session by making a GET request
        try {
            await apiClient.get('/user');

            // Retry the original request
            const originalRequest = error.config;
            return apiClient.request(originalRequest);
        } catch (refreshError) {
            // If refresh fails, suggest user to refresh the page
            error.message = 'Sessão expirada. Por favor, atualize a página e tente novamente.';
        }
    }

    return Promise.reject(error);
};

apiClient.interceptors.response.use(handleResponse, handleError);
paymentClient.interceptors.response.use(handleResponse, handleError); 