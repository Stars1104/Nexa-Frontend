import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

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
        console.error('Error getting Google OAuth URL:', error);
        throw new Error(error.response?.data?.message || 'Failed to get Google OAuth URL');
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
        console.error('Error handling Google callback:', error);
        throw new Error(error.response?.data?.message || 'Failed to authenticate with Google');
    }
};

// Handle Google OAuth with role selection
export const handleGoogleAuthWithRole = async (role: 'creator' | 'brand') => {
    try {
        const response = await GoogleAuthAPI.post("/api/google/auth", { role });
        return response.data;
    } catch (error: any) {
        console.error('Error handling Google auth with role:', error);
        throw new Error(error.response?.data?.message || 'Failed to authenticate with Google');
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
            console.log('Google OAuth initiated without role (will default to creator)');
        }
        
        // Redirect to Google OAuth
        window.location.href = redirect_url;
    } catch (error) {
        console.error('Error initiating Google OAuth:', error);
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
            throw new Error('No authorization code received');
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
        console.error('Error handling OAuth callback:', error);
        throw error;
    }
};

 