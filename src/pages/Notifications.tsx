import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
    fetchNotifications, 
    selectNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    selectUnreadCount
} from '../store/slices/notificationSlice';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Check, Trash2, Bell, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { token } = useAppSelector((state) => state.auth);
    const notifications = useAppSelector(selectNotifications);
    const unreadCount = useAppSelector(selectUnreadCount);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (token) {
            dispatch(fetchNotifications(token));
        }
    }, [dispatch, token]);

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const handleMarkAsRead = async (notificationId: number) => {
        if (!token) return;
        
        try {
            await dispatch(markNotificationAsRead({ notificationId, token })).unwrap();
            toast.success('Notificação marcada como lida');
        } catch (error) {
            toast.error('Erro ao marcar notificação como lida');
        }
    };

    const handleDeleteNotification = async (notificationId: number) => {
        if (!token) return;
        
        try {
            await dispatch(deleteNotification({ notificationId, token })).unwrap();
            toast.success('Notificação excluída');
        } catch (error) {
            toast.error('Erro ao excluir notificação');
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

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'login_detected':
            case 'new_project':
            case 'project_approved':
            case 'proposal_approved':
                return '✅';
            case 'project_rejected':
            case 'proposal_rejected':
                return '❌';
            case 'new_message':
                return '💬';
            default:
                return '🔔';
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

    const getNotificationTypeLabel = (type: string) => {
        switch (type) {
            case 'login_detected':
                return 'Login Detectado';
            case 'new_project':
                return 'Novo Projeto';
            case 'project_approved':
                return 'Projeto Aprovado';
            case 'project_rejected':
                return 'Projeto Rejeitado';
            case 'proposal_approved':
                return 'Proposta Aprovada';
            case 'proposal_rejected':
                return 'Proposta Rejeitada';
            case 'new_message':
                return 'Nova Mensagem';
            default:
                return 'Notificação';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Notificações</h1>
                            <p className="text-muted-foreground">
                                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas as notificações foram lidas'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Marcar todas como lidas
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        Todas ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'default' : 'outline'}
                        onClick={() => setFilter('unread')}
                    >
                        Não lidas ({unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {filter === 'unread' 
                                        ? 'Todas as suas notificações foram lidas.' 
                                        : 'Você ainda não recebeu nenhuma notificação.'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <Card key={notification.id} className={`transition-all ${!notification.is_read ? 'border-primary/50 bg-primary/5' : ''}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1 text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-lg">
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.is_read && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Não lida
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {getNotificationTypeLabel(notification.type)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground mb-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {!notification.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="h-8 w-8 p-0 hover:bg-accent"
                                                            title="Marcar como lida"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteNotification(notification.id)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-accent"
                                                        title="Excluir notificação"
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
    );
};

export default NotificationsPage; 