import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";


const PagarMeAuthAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});


PagarMeAuthAPI.interceptors.request.use(
    (config) => {
        
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


PagarMeAuthAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('persist:auth');

            
            console.warn('PagarMe authentication failed - token expired or invalid');
        }
        return Promise.reject(error);
    }
);


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


export const pagarmeAuthApi = {
    
    authenticate: async (data: PagarMeAuthRequest): Promise<PagarMeAuthResponse> => {
        const response = await PagarMeAuthAPI.post("/api/pagarme/authenticate", data);
        return response.data;
    },

    
    linkAccount: async (data: PagarMeLinkAccountRequest): Promise<PagarMeLinkAccountResponse> => {
        const response = await PagarMeAuthAPI.post("/api/pagarme/link-account", data);
        return response.data;
    },

    
    unlinkAccount: async (): Promise<PagarMeLinkAccountResponse> => {
        const response = await PagarMeAuthAPI.post("/api/pagarme/unlink-account");
        return response.data;
    },

    
    getAccountInfo: async (): Promise<PagarMeAccountInfo> => {
        const response = await PagarMeAuthAPI.get("/api/pagarme/account-info");
        return response.data;
    },
};

export default pagarmeAuthApi; 