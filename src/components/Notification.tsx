import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { 
    Bell, 
    CheckCircle, 
    AlertCircle, 
    Info, 
    X, 
    Filter,
    Check,
    Trash2,
    Archive
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification,
    selectNotifications,
    selectUnreadCount,
    selectNotificationLoading,
    selectNotificationError
} from "../store/slices/notificationSlice";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    time: string;
    type: 'success' | 'warning' | 'info' | 'error';
    unread: boolean;
    category: 'campaign' | 'payment' | 'application' | 'system';
}

// Map notification types to display types
const getNotificationType = (type: string): 'success' | 'warning' | 'info' | 'error' => {
    switch (type) {
        case 'login_detected':
        case 'new_project':
        case 'project_approved':
        case 'proposal_approved':
            return 'success';
        case 'project_rejected':
        case 'proposal_rejected':
            return 'error';
        case 'new_message':
            return 'info';
        default:
            return 'info';
    }
};

// Map notification types to categories
const getNotificationCategory = (type: string): 'campaign' | 'payment' | 'application' | 'system' => {
    switch (type) {
        case 'new_project':
        case 'project_approved':
        case 'project_rejected':
            return 'campaign';
        case 'proposal_approved':
        case 'proposal_rejected':
            return 'application';
        case 'new_message':
            return 'system';
        case 'login_detected':
        default:
            return 'system';
    }
};

const Notification = () => {
    const dispatch = useAppDispatch();
    const { user, token } = useAppSelector((state) => state.auth);
    const notifications = useAppSelector(selectNotifications);
    const unreadCount = useAppSelector(selectUnreadCount);
    const isLoading = useAppSelector(selectNotificationLoading);
    const error = useAppSelector(selectNotificationError);

    const [filter, setFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Fetch notifications on component mount
    useEffect(() => {
        if (token) {
            dispatch(fetchNotifications({ token }));
        }
    }, [dispatch, token]);

    // Handle errors
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getCategoryBadge = (category: string) => {
        const categoryConfig = {
            campaign: { label: 'Campanha', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
            payment: { label: 'Pagamento', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
            application: { label: 'Aplicação', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
            system: { label: 'Sistema', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300' }
        };
        
        const config = categoryConfig[category as keyof typeof categoryConfig];
        return (
            <Badge className={`text-xs ${config.color}`}>
                {config.label}
            </Badge>
        );
    };

    // Convert API notifications to display format
    const displayNotifications: NotificationItem[] = notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: new Date(notification.created_at).toLocaleString('pt-BR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }),
        type: getNotificationType(notification.type),
        unread: !notification.is_read,
        category: getNotificationCategory(notification.type)
    }));

    const filteredNotifications = displayNotifications.filter(notification => {
        const matchesFilter = filter === 'all' || 
            (filter === 'unread' && notification.unread) ||
            (filter === 'read' && !notification.unread);
        
        const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
        
        return matchesFilter && matchesCategory;
    });

    const handleMarkAsRead = async (id: number) => {
        if (!token) return;
        
        try {
            await dispatch(markNotificationAsRead({ notificationId: id, token })).unwrap();
            toast.success('Notificação marcada como lida');
        } catch (error) {
            toast.error('Erro ao marcar notificação como lida');
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!token) return;
        
        try {
            await dispatch(markAllNotificationsAsRead(token)).unwrap();
            toast.success('Todas as notificações foram marcadas como lidas');
        } catch (error) {
            toast.error('Erro ao marcar notificações como lidas');
        }
    };

    const handleDeleteNotification = async (id: number) => {
        if (!token) return;
        
        try {
            await dispatch(deleteNotification({ notificationId: id, token })).unwrap();
            toast.success('Notificação excluída');
        } catch (error) {
            toast.error('Erro ao excluir notificação');
        }
    };

    const clearAllRead = () => {
        // This would need a new API endpoint to clear all read notifications
        toast.info('Funcionalidade em desenvolvimento');
    };

    const canonical = typeof window !== "undefined" ? window.location.href : "";
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
    };

    return (
        <>
            <Helmet>
                <title>Nexa - Notificações</title>
                <meta name="description" content="Browse Nexa guides filtered by brand and creator. Watch embedded videos and manage guides." />
                {canonical && <link rel="canonical" href={canonical} />}
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>
            <div className="min-h-[92vh] dark:bg-[#171717] flex flex-col py-4 px-2 sm:px-10">
                <div className="w-full mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Notificações</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''} • {notifications.length} total
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                disabled={unreadCount === 0}
                                className="text-xs"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Marcar todas como lidas
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={clearAllRead}
                                className="text-xs"
                            >
                                <Archive className="w-4 h-4 mr-2" />
                                Limpar lidas
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Filtros:</span>
                                </div>
                                
                                <Select value={filter} onValueChange={setFilter}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="unread">Não lidas</SelectItem>
                                        <SelectItem value="read">Lidas</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas categorias</SelectItem>
                                        <SelectItem value="campaign">Campanhas</SelectItem>
                                        <SelectItem value="payment">Pagamentos</SelectItem>
                                        <SelectItem value="application">Aplicações</SelectItem>
                                        <SelectItem value="system">Sistema</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {filteredNotifications.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                                    <p className="text-muted-foreground">
                                        {filter === 'all' ? 'Você está em dia com suas notificações!' : 'Nenhuma notificação encontrada com os filtros selecionados.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredNotifications.map((notification, index) => (
                                <Card 
                                    key={`notif-${notification.id}`} 
                                    className={`transition-all duration-200 hover:shadow-md ${
                                        notification.unread ? 'border-l-4 border-l-primary bg-accent/20' : ''
                                    }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className={`font-medium ${notification.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {notification.title}
                                                            </h3>
                                                            {notification.unread && (
                                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            {getCategoryBadge(notification.category)}
                                                            <span className="text-xs text-muted-foreground">
                                                                {notification.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        {notification.unread && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteNotification(notification.id)}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Notification;