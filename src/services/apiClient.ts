import axios from 'axios';
import { safeGetLocalStorage } from '../utils/browserUtils';

// Utility function to handle authentication failures
const handleAuthFailure = () => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
        return;
    }
    
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

// Utility function to check if error is a network error
const isNetworkError = (error: any): boolean => {
    return (
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        error.message === 'ERR_CONNECTION_REFUSED' ||
        error.message === 'ERR_INTERNET_DISCONNECTED' ||
        error.message === 'ERR_NETWORK_CHANGED' ||
        error.message === 'ERR_TIMEOUT' ||
        error.message === 'ERR_FAILED' ||
        !error.response ||
        error.response?.status === 0
    );
};

// Utility function to get user-friendly error message
const getErrorMessage = (error: any): string => {
    if (isNetworkError(error)) {
        return "Erro de conexão: O servidor não está respondendo. Verifique se o backend está rodando e tente novamente.";
    }
    
    if (error.response?.status === 404) {
        return "Recurso não encontrado. Pode ter sido removido ou você não tem permissão para acessá-lo.";
    }
    
    if (error.response?.status === 403) {
        return "Acesso negado. Você não tem permissão para realizar esta ação.";
    }
    
    if (error.response?.status === 400) {
        return error.response?.data?.message || "Dados inválidos para esta operação.";
    }
    
    if (error.response?.status >= 500) {
        return "Erro interno do servidor. Tente novamente em alguns instantes.";
    }
    
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    if (error.message) {
        return error.message;
    }
    
    return "Ocorreu um erro inesperado. Tente novamente.";
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

            // Enhance error message for network errors
            if (isNetworkError(error)) {
                error.userMessage = getErrorMessage(error);
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
        const reduxState = safeGetLocalStorage('persist:root');
        if (reduxState) {
            const parsedState = JSON.parse(reduxState);
            const authState = JSON.parse(parsedState.auth || '{}');
            if (authState.token) {
                token = JSON.parse(authState.token);
            }
        }
    } catch (e) {
        // Silently continue to fallback
    }
    
    // Fallback to localStorage if Redux state doesn't have token
    if (!token) {
        token = safeGetLocalStorage('token');
    }
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('API Request Debug: No token found for request to', config.url);
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
    // Log the error for debugging
    console.error('API Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
    });
    
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

    // Enhance error message for network errors
    if (isNetworkError(error)) {
        error.userMessage = getErrorMessage(error);
    }

    return Promise.reject(error);
};

apiClient.interceptors.response.use(handleResponse, handleError);
paymentClient.interceptors.response.use(handleResponse, handleError);

// Export utility functions for use in components
export { isNetworkError, getErrorMessage }; 