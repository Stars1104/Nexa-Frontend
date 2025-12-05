import axios from 'axios';

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";


const NotificationAPI = axios.create({
    baseURL: BackendURL,
    headers: {
        'Content-Type': 'application/json',
    },
});


const setAuthToken = (token: string) => {
    if (token) {
        NotificationAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete NotificationAPI.defaults.headers.common['Authorization'];
    }
};


export const getNotifications = async (token: string, params?: {
    per_page?: number;
    type?: string;
    is_read?: boolean;
}) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.get('/api/notifications', { params });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const getUnreadCount = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.get('/api/notifications/unread-count');
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const markAsRead = async (notificationId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.post(`/api/notifications/${notificationId}/mark-read`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const markAllAsRead = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.post('/api/notifications/mark-all-read');
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const deleteNotification = async (notificationId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.delete(`/api/notifications/${notificationId}`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const getNotificationStatistics = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.get('/api/notifications/statistics');
        return response.data;
    } catch (error: any) {
        throw error;
    }
}; 