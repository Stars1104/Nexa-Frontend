import axios from 'axios';

const BackendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UserAPI = axios.create({
    baseURL: BackendURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const setAuthToken = (token: string) => {
    UserAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Get creator profile for brands
export const GetCreatorProfile = async (creatorId: string, token: string) => {
    setAuthToken(token);
    try {
        const response = await UserAPI.get(`/api/creators/${creatorId}/profile`);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching creator profile:", error);
        
        // Handle different types of errors
        if (error.response?.status === 404) {
            throw new Error("Criador não encontrado.");
        } else if (error.response?.status === 401) {
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
        } else if (error.response?.status === 403) {
            throw new Error("Acesso negado. Você não tem permissão para ver este perfil.");
        } else if (error.response?.status >= 500) {
            throw new Error("Erro do servidor. Tente novamente mais tarde.");
        } else if (error.response?.status === 302) {
            // Handle redirect to login (authentication required)
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
            throw new Error("Erro de conexão. Verifique sua conexão com a internet.");
        } else {
            throw new Error(error.response?.data?.message || "Erro ao carregar perfil do criador");
        }
    }
}; 