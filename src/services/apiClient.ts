import axios from 'axios';

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

// Request interceptor to add auth token
const addAuthToken = (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

apiClient.interceptors.request.use(addAuthToken, (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
});

paymentClient.interceptors.request.use(addAuthToken, (error) => {
    console.error('Payment API Request Error:', error);
    return Promise.reject(error);
});

// Response interceptor to handle errors
const handleResponse = (response: any) => {
    return response;
};

const handleError = async (error: any) => {
    console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
        // Don't automatically clear token, let the auth hook handle it
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
            error.message = 'Session expired. Please refresh the page and try again.';
        }
    }

    return Promise.reject(error);
};

apiClient.interceptors.response.use(handleResponse, handleError);
paymentClient.interceptors.response.use(handleResponse, handleError); 