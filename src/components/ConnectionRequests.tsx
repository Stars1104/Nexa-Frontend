import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
    UserPlus, 
    UserCheck, 
    UserX, 
    Clock, 
    Check, 
    X, 
    MessageCircle,
    Calendar
} from 'lucide-react';
import { chatService, ConnectionRequest } from '../services/chatService';
import { format, isToday, isYesterday } from 'date-fns';

interface ConnectionRequestsProps {
    onRequestAccepted?: (request: ConnectionRequest) => void;
    className?: string;
}

export default function ConnectionRequests({ onRequestAccepted, className }: ConnectionRequestsProps) {
    const [requests, setRequests] = useState<{
        received: ConnectionRequest[];
        sent: ConnectionRequest[];
    }>({ received: [], sent: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setIsLoading(true);
            
            const [receivedResponse, sentResponse] = await Promise.all([
                chatService.getConnectionRequests('received'),
                chatService.getConnectionRequests('sent')
            ]);

            setRequests({
                received: receivedResponse.data,
                sent: sentResponse.data
            });
        } catch (error) {
            console.error('Error loading connection requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestAction = async (requestId: number, action: 'accept' | 'reject' | 'cancel') => {
        try {
            if (action === 'accept') {
                await chatService.acceptConnectionRequest(requestId);
                // Find the request and call callback
                const request = requests.received.find(r => r.id === requestId);
                if (request && onRequestAccepted) {
                    onRequestAccepted(request);
                }
            } else if (action === 'reject') {
                await chatService.rejectConnectionRequest(requestId);
            } else if (action === 'cancel') {
                await chatService.cancelConnectionRequest(requestId);
            }

            // Reload requests
            await loadRequests();
        } catch (error) {
            console.error(`Error ${action}ing connection request:`, error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d, yyyy');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-amber-500" />;
            case 'accepted':
                return <Check className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <X className="w-4 h-4 text-red-500" />;
            case 'cancelled':
                return <X className="w-4 h-4 text-gray-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200';
            case 'accepted':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
        }
    };

    const renderRequest = (request: ConnectionRequest, type: 'received' | 'sent') => {
        const isReceived = type === 'received';
        const otherUser = isReceived ? request.sender : request.receiver;

        return (
            <Card key={request.id} className="mb-4">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {otherUser.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(request.status)}
                                    <Badge className={getStatusColor(request.status)}>
                                        {request.status}
                                    </Badge>
                                </div>
                            </div>
                            
                            {request.message && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    "{request.message}"
                                </p>
                            )}
                            
                            {request.campaign && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Campaign: {request.campaign.title}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(request.created_at)}</span>
                            </div>
                        </div>
                        
                        {isReceived && request.status === 'pending' && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleRequestAction(request.id, 'accept')}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        
                        {!isReceived && request.status === 'pending' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestAction(request.id, 'cancel')}
                                className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Loading connection requests...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const hasRequests = requests.received.length > 0 || requests.sent.length > 0;

    if (!hasRequests) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="text-center">
                        <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                            No Connection Requests
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            You don't have any connection requests yet.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Connection Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'received' | 'sent')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="received" className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Received ({requests.received.length})
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Sent ({requests.sent.length})
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="received" className="mt-4">
                        {requests.received.length > 0 ? (
                            requests.received.map(request => renderRequest(request, 'received'))
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No received connection requests</p>
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="sent" className="mt-4">
                        {requests.sent.length > 0 ? (
                            requests.sent.map(request => renderRequest(request, 'sent'))
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No sent connection requests</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 