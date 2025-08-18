import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";

// Google OAuth API
const GoogleAuthAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

// Get Google OAuth URL
export const getGoogleOAuthURL = async () => {
    try {
        const response = await GoogleAuthAPI.get("/api/google/redirect");
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Falha ao obter URL do Google OAuth');
    }
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (code: string, role?: 'creator' | 'brand') => {
    try {
        const params = new URLSearchParams({ code });
        if (role) {
            params.append('role', role);
        }
        const response = await GoogleAuthAPI.get(`/api/google/callback?${params.toString()}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Falha na autenticação com Google');
    }
};

// Handle Google OAuth with role selection
export const handleGoogleAuthWithRole = async (role: 'creator' | 'brand') => {
    try {
        const response = await GoogleAuthAPI.post("/api/google/auth", { role });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Falha na autenticação com Google');
    }
};

// Google OAuth flow helper
export const initiateGoogleOAuth = async (role?: 'creator' | 'brand') => {
    try {
        // Get the OAuth URL
        const { redirect_url } = await getGoogleOAuthURL();

        // Store the role in sessionStorage for later use
        if (role) {
            sessionStorage.setItem('google_oauth_role', role);
        } else {

        }

        // Redirect to Google OAuth
        window.location.href = redirect_url;
    } catch (error) {
        throw error;
    }
};

// Handle OAuth callback from URL
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

        // Get the stored role
        const role = sessionStorage.getItem('google_oauth_role') as 'creator' | 'brand' | null;

        let authData;
        if (role) {
            // Pass the role as a query parameter to the callback
            authData = await handleGoogleCallback(code, role);
            sessionStorage.removeItem('google_oauth_role');
        } else {
            // Use default callback (defaults to creator)
            authData = await handleGoogleCallback(code);
        }

        return authData;
    } catch (error) {
        throw error;
    }
};

