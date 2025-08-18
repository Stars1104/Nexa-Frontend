import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import * as notificationAPI from '../../api/notification';

// Types
export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    statistics: {
        total: number;
        unread: number;
        read: number;
        by_type: Record<string, number>;
    } | null;
}

// Initial state
const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    statistics: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk<
    { data: Notification[]; pagination: any },
    { token: string; params?: any },
    { state: RootState; rejectValue: string }
>('notification/fetchNotifications', async ({ token, params }, { rejectWithValue }) => {
    try {
        const response = await notificationAPI.getNotifications(token, params);
        return response;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Falha ao buscar notificações');
    }
});

export const fetchUnreadCount = createAsyncThunk<
    number,
    string,
    { state: RootState; rejectValue: string }
>('notification/fetchUnreadCount', async (token, { rejectWithValue }) => {
    try {
        const response = await notificationAPI.getUnreadCount(token);
        return response.count;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Falha ao buscar contagem de não lidas');
    }
});

export const markNotificationAsRead = createAsyncThunk<
    number,
    { notificationId: number; token: string },
    { state: RootState; rejectValue: string }
>('notification/markAsRead', async ({ notificationId, token }, { rejectWithValue }) => {
    try {
        await notificationAPI.markAsRead(notificationId, token);
        return notificationId;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Falha ao marcar notificação como lida');
    }
});

export const markAllNotificationsAsRead = createAsyncThunk<
    void,
    string,
    { state: RootState; rejectValue: string }
>('notification/markAllAsRead', async (token, { rejectWithValue }) => {
    try {
        await notificationAPI.markAllAsRead(token);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Falha ao marcar todas as notificações como lidas');
    }
});

export const deleteNotification = createAsyncThunk<
    number,
    { notificationId: number; token: string },
    { state: RootState; rejectValue: string }
>('notification/deleteNotification', async ({ notificationId, token }, { rejectWithValue }) => {
    try {
        await notificationAPI.deleteNotification(notificationId, token);
        return notificationId;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Falha ao excluir notificação');
    }
});

export const fetchNotificationStatistics = createAsyncThunk<
    any,
    string,
    { state: RootState; rejectValue: string }
>('notification/fetchStatistics', async (token, { rejectWithValue }) => {
    try {
        const response = await notificationAPI.getNotificationStatistics(token);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Falha ao buscar estatísticas de notificação');
    }
});

// Slice
const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.is_read) {
                state.unreadCount += 1;
            }
        },
        updateNotification: (state, action: PayloadAction<Notification>) => {
            const index = state.notifications.findIndex(n => n.id === action.payload.id);
            if (index !== -1) {
                const wasRead = state.notifications[index].is_read;
                const isNowRead = action.payload.is_read;
                
                state.notifications[index] = action.payload;
                
                if (!wasRead && isNowRead) {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                } else if (wasRead && !isNowRead) {
                    state.unreadCount += 1;
                }
            }
        },
        removeNotification: (state, action: PayloadAction<number>) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.is_read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },
        decrementUnreadCount: (state) => {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
        },
        resetUnreadCount: (state) => {
            state.unreadCount = 0;
        },
    },
    extraReducers: (builder) => {
        // Fetch notifications
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = action.payload.data;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Falha ao buscar notificações';
            });

        // Fetch unread count
        builder
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(fetchUnreadCount.rejected, (state, action) => {
                state.error = action.payload || 'Falha ao buscar contagem de não lidas';
            });

        // Mark as read
        builder
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.is_read) {
                    notification.is_read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markNotificationAsRead.rejected, (state, action) => {
                state.error = action.payload || 'Falha ao marcar notificação como lida';
            });

        // Mark all as read
        builder
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach(notification => {
                    notification.is_read = true;
                });
                state.unreadCount = 0;
            })
            .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
                state.error = action.payload || 'Falha ao marcar todas as notificações como lidas';
            });

        // Delete notification
        builder
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.is_read) {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.notifications = state.notifications.filter(n => n.id !== action.payload);
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.error = action.payload || 'Falha ao excluir notificação';
            });

        // Fetch statistics
        builder
            .addCase(fetchNotificationStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload;
            })
            .addCase(fetchNotificationStatistics.rejected, (state, action) => {
                state.error = action.payload || 'Falha ao buscar estatísticas de notificação';
            });
    },
});

// Actions
export const {
    clearError,
    addNotification,
    updateNotification,
    removeNotification,
    incrementUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: RootState) => state.notification.notifications;
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount;
export const selectNotificationLoading = (state: RootState) => state.notification.isLoading;
export const selectNotificationError = (state: RootState) => state.notification.error;
export const selectNotificationStatistics = (state: RootState) => state.notification.statistics;

export default notificationSlice.reducer; 