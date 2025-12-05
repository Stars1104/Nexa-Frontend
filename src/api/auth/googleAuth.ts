import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";


const GoogleAuthAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});


export const getGoogleOAuthURL = async () => {
    try {
        const response = await GoogleAuthAPI.get("/api/google/redirect");
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Falha ao obter URL do Google OAuth');
    }
};


export const handleGoogleCallback = async (code: string, role?: 'creator' | 'brand', isStudent?: boolean) => {
    try {
        const params = new URLSearchParams({ code });
        if (role) {
            params.append('role', role);
        }
        if (isStudent) {
            params.append('is_student', 'true');
        }
        const response = await GoogleAuthAPI.get(`/api/google/callback?${params.toString()}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Falha na autenticação com Google');
    }
};


export const handleGoogleAuthWithRole = async (role: 'creator' | 'brand') => {
    try {
        const response = await GoogleAuthAPI.post("/api/google/auth", { role });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Falha na autenticação com Google');
    }
};


export const initiateGoogleOAuth = async (role?: 'creator' | 'brand', isStudent?: boolean) => {
    try {
        
        const { redirect_url } = await getGoogleOAuthURL();

        
        if (role) {
            sessionStorage.setItem('google_oauth_role', role);
        }
        
        if (isStudent) {
            sessionStorage.setItem('google_oauth_is_student', 'true');
        } else {
            sessionStorage.removeItem('google_oauth_is_student');
        }

        
        window.location.href = redirect_url;
    } catch (error) {
        throw error;
    }
};


export const handleOAuthCallback = async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
            throw new Error('Nenhum código de autorização recebido');
        }

        
        const role = sessionStorage.getItem('google_oauth_role') as 'creator' | 'brand' | null;
        const isStudent = sessionStorage.getItem('google_oauth_is_student') === 'true';

        let authData;
        if (role) {
            
            authData = await handleGoogleCallback(code, role, isStudent);
            sessionStorage.removeItem('google_oauth_role');
            sessionStorage.removeItem('google_oauth_is_student');
        } else {
            
            authData = await handleGoogleCallback(code, undefined, isStudent);
            sessionStorage.removeItem('google_oauth_is_student');
        }

        return authData;
    } catch (error) {
        throw error;
    }
};

