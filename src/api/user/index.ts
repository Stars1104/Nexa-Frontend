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
export const getCreatorProfile = async (creatorId: string) => {
    try {
        const response = await UserAPI.get(`/creators/${creatorId}/profile`);
        return response.data;
    } catch (error) {
        throw error;
    }
}; 