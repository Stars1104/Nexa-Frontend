import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";

// Pagar.me Auth API
const PagarMeAuthAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

// Request interceptor to add token dynamically
PagarMeAuthAPI.interceptors.request.use(
    (config) => {
        // Get token from localStorage if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle unauthorized responses
PagarMeAuthAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is expired or invalid, clear authentication
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('persist:auth');

            // Don't redirect here - let the components handle navigation
            console.warn('PagarMe authentication failed - token expired or invalid');
        }
        return Promise.reject(error);
    }
);

// Types
export interface PagarMeAuthRequest {
    account_id: string;
    email: string;
    name: string;
}

export interface PagarMeAuthResponse {
    success: boolean;
    token: string;
    token_type: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar_url?: string;
        student_verified: boolean;
        has_premium: boolean;
        account_id?: string;
    };
    message: string;
}

export interface PagarMeAccountInfo {
    success: boolean;
    account_info: any;
    linked_at: string;
}

export interface PagarMeLinkAccountRequest {
    account_id: string;
}

export interface PagarMeLinkAccountResponse {
    success: boolean;
    message: string;
    user: {
        id: number;
        name: string;
        email: string;
        account_id: string;
    };
}

// Pagar.me Authentication Functions
export const pagarmeAuthApi = {
    // Authenticate user using Pagar.me account_id
    authenticate: async (data: PagarMeAuthRequest): Promise<PagarMeAuthResponse> => {
        const response = await PagarMeAuthAPI.post("/api/pagarme/authenticate", data);
        return response.data;
    },

    // Link existing user account with Pagar.me account_id
    linkAccount: async (data: PagarMeLinkAccountRequest): Promise<PagarMeLinkAccountResponse> => {
        const response = await PagarMeAuthAPI.post("/api/pagarme/link-account", data);
        return response.data;
    },

    // Unlink Pagar.me account_id from user account
    unlinkAccount: async (): Promise<PagarMeLinkAccountResponse> => {
        const response = await PagarMeAuthAPI.post("/api/pagarme/unlink-account");
        return response.data;
    },

    // Get Pagar.me account information
    getAccountInfo: async (): Promise<PagarMeAccountInfo> => {
        const response = await PagarMeAuthAPI.get("/api/pagarme/account-info");
        return response.data;
    },
};

export default pagarmeAuthApi; 