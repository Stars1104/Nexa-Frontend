import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
    fetchUnreadCount, 
    fetchNotifications,
    selectUnreadCount,
    selectNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead
} from '../store/slices/notificationSlice';
import { toast } from 'sonner';
import { Separator } from './ui/separator';

const NotificationBell = () => {
    const dispatch = useAppDispatch();
    const { token } = useAppSelector((state) => state.auth);
    const unreadCount = useAppSelector(selectUnreadCount);
    const notifications = useAppSelector(selectNotifications);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch unread count and recent notifications on mount
    useEffect(() => {
        if (token) {
            dispatch(fetchUnreadCount(token));
            // Fetch recent notifications (last 10)
            dispatch(fetchNotifications({ token, params: { per_page: 10 } }));
        }
    }, [dispatch, token]);
    
    // Get recent notifications (last 5 for display)
    const recentNotifications = notifications.slice(0, 5);

    const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent notification click
        if (!token) return;
        
        try {
            await dispatch(deleteNotification({ notificationId, token })).unwrap();
            toast.success('Notificação excluída');
        } catch (error) {
            toast.error('Erro ao excluir notificação');
        }
    };

    const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent notification click
        if (!token) return;
        
        try {
            await dispatch(markNotificationAsRead({ notificationId, token })).unwrap();
            toast.success('Notificação marcada como lida');
        } catch (error) {
            toast.error('Erro ao marcar notificação como lida');
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!token) return;
        
        try {
            await dispatch(markAllNotificationsAsRead(token)).unwrap();
            toast.success('Todas as notificações marcadas como lidas');
        } catch (error) {
            toast.error('Erro ao marcar notificações como lidas');
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
        return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                    <h3 className="font-semibold dark:text-white text-black">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'No notifications'}
                    </p>
                </div>
                
                <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                    {recentNotifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {recentNotifications.map((notification, index) => (
                                <div key={notification.id}>
                                    <div  className="p-4 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm mb-1 dark:text-white text-black">
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        {!notification.is_read && (
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                            className="h-6 w-6 p-0 hover:bg-accent"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-accent"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {index < recentNotifications.length - 1 && (
                                        <Separator className="mx-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {unreadCount > 0 && (
                    <div className="p-3 border-t">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell; 