import axios from 'axios';

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";

// Create axios instance for notification API
const NotificationAPI = axios.create({
    baseURL: BackendURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Set auth token for requests
const setAuthToken = (token: string) => {
    if (token) {
        NotificationAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete NotificationAPI.defaults.headers.common['Authorization'];
    }
};

// Get user notifications
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

// Get unread notification count
export const getUnreadCount = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.get('/api/notifications/unread-count');
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Mark notification as read
export const markAsRead = async (notificationId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.post(`/api/notifications/${notificationId}/mark-read`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Mark all notifications as read
export const markAllAsRead = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.post('/api/notifications/mark-all-read');
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Delete notification
export const deleteNotification = async (notificationId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.delete(`/api/notifications/${notificationId}`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get notification statistics
export const getNotificationStatistics = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await NotificationAPI.get('/api/notifications/statistics');
        return response.data;
    } catch (error: any) {
        throw error;
    }
}; 