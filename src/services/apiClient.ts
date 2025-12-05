import axios from 'axios';
import { safeGetLocalStorage } from '../utils/browserUtils';
import { sessionManager } from '../utils/sessionManager';
import { SESSION_CONFIG } from '../config/sessionConfig';


const handleAuthFailure = () => {
    
    if (typeof window === 'undefined') {
        return;
    }
    
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('persist:auth');
    localStorage.removeItem('persist:root');
    
    
    if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
    }
};


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


export const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api`,
    timeout: 30000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});


export const paymentClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api`,
    timeout: 60000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});



export const uploadClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api`,
    timeout: 600000, 
    maxContentLength: Infinity, 
    maxBodyLength: Infinity, 
    headers: {
        'Accept': 'application/json',
        
    },
});


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

    
    client.interceptors.request.use((config) => {
        
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    });

    
    client.interceptors.response.use(
        (response) => {
            
            if (SESSION_CONFIG.EXTEND_ON_API_CALLS) {
                sessionManager.extendSession();
            }
            return response;
        },
        async (error) => {
            console.error('API Client: Response error:', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method
            });
            
            
            if (error.response?.status === 401) {
                handleAuthFailure();
                
                
                error.message = 'Sessão expirada. Por favor, faça login novamente.';
            }

            
            if (error.response?.status === 403 && error.response?.data?.error === 'premium_required') {
                
            }

            
            if (error.response?.status === 419) {
                try {
                    await client.get('/user');
                    const originalRequest = error.config;
                    return client.request(originalRequest);
                } catch (refreshError) {
                    error.message = 'Sessão expirada. Por favor, atualize a página e tente novamente.';
                }
            }

            
            if (isNetworkError(error)) {
                error.userMessage = getErrorMessage(error);
            }

            return Promise.reject(error);
        }
    );

    return client;
};


const addAuthToken = (config: any) => {
    
    let token = null;
    
    
    try {
        
        const reduxState = safeGetLocalStorage('persist:root');
        if (reduxState) {
            const parsedState = JSON.parse(reduxState);
            const authState = JSON.parse(parsedState.auth || '{}');
            if (authState.token) {
                token = JSON.parse(authState.token);
            }
        }
    } catch (e) {
        
    }
    
    
    if (!token) {
        token = safeGetLocalStorage('token');
    }
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('API Request Debug: No token found for request to', config.url);
    }
    
    
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    
    return config;
};

apiClient.interceptors.request.use(addAuthToken, (error) => {
    return Promise.reject(error);
});

paymentClient.interceptors.request.use(addAuthToken, (error) => {
    return Promise.reject(error);
});

uploadClient.interceptors.request.use((config) => {
    
    addAuthToken(config);
    
    
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


const handleResponse = (response: any) => {
    
    if (SESSION_CONFIG.EXTEND_ON_API_CALLS) {
        sessionManager.extendSession();
    }
    return response;
};

const handleError = async (error: any) => {
    
    console.error('API Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
    });
    
    
    if (error.response?.status === 401) {           
        handleAuthFailure();
        
        
        error.message = 'Sessão expirada. Por favor, faça login novamente.';
    }

    
    if (error.response?.status === 403 && error.response?.data?.error === 'premium_required') {
        
    }

    
    if (error.response?.status === 419) {
        
        try {
            await apiClient.get('/user');

            
            const originalRequest = error.config;
            return apiClient.request(originalRequest);
        } catch (refreshError) {
            
            error.message = 'Sessão expirada. Por favor, atualize a página e tente novamente.';
        }
    }

    
    if (isNetworkError(error)) {
        error.userMessage = getErrorMessage(error);
    }

    return Promise.reject(error);
};

apiClient.interceptors.response.use(handleResponse, handleError);
paymentClient.interceptors.response.use(handleResponse, handleError);
uploadClient.interceptors.response.use(handleResponse, handleError);


export { isNetworkError, getErrorMessage }; 