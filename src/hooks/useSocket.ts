import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { apiClient } from '../services/apiClient';
import { Message, chatService } from '../services/chatService';
import { addNotification, incrementUnreadCount } from '../store/slices/notificationSlice';

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    connectionError: string | null;
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    sendMessage: (roomId: string, message: string, file?: File) => Promise<Message>;
    startTyping: (roomId: string) => void;
    stopTyping: (roomId: string) => void;
    markMessagesAsRead: (roomId: string, messageIds: number[]) => Promise<void>;
    onMessagesRead: (callback: (data: { roomId: string; messageIds: number[]; readBy: number; timestamp: string }) => void) => void;
    onOfferCreated: (callback: (data: { roomId: string; offerData: any; senderId: number; timestamp: string }) => void) => void;
    onOfferAccepted: (callback: (data: { roomId: string; offerData: any; contractData: any; senderId: number; timestamp: string }) => void) => void;
    onOfferRejected: (callback: (data: { roomId: string; offerData: any; senderId: number; rejectionReason?: string; timestamp: string }) => void) => void;
    onOfferCancelled: (callback: (data: { roomId: string; offerData: any; senderId: number; timestamp: string }) => void) => void;
    onContractCompleted: (callback: (data: { roomId: string; contractData: any; senderId: number; timestamp: string }) => void) => void;
    onContractTerminated: (callback: (data: { roomId: string; contractData: any; senderId: number; terminationReason?: string; timestamp: string }) => void) => void;
    onContractActivated: (callback: (data: { roomId: string; contractData: any; senderId: number; timestamp: string }) => void) => void;
    onContractStatusUpdate: (callback: (data: { roomId: string; contractData: any; terminationReason?: string; timestamp: string }) => void) => void;
    sendOfferAcceptanceMessage: (roomId: string, offerData: any, contractData: any, senderId: number, senderName: string, senderAvatar?: string) => void;
    reconnect: () => void;
}

interface UseSocketOptions {
    enableNotifications?: boolean;
    enableChat?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
    const { enableNotifications = true, enableChat = true } = options;
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const isMountedRef = useRef(true);

    // Initialize socket connection
    const initializeSocket = useCallback(() => {
        if (!user || !isMountedRef.current) return null;

        // Clear any existing connection
        if (socketRef.current) {
            try {
                socketRef.current.disconnect();
            } catch (error) {
                console.warn('Error disconnecting existing socket:', error);
            }
        }

        // const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
        //     path: '/socket.io',
        //     transports: ['websocket', 'polling'],
        //     autoConnect: true,
        //     reconnection: true,
        //     reconnectionAttempts: maxReconnectAttempts,
        //     reconnectionDelay: 500, // Reduced from 1000ms
        //     reconnectionDelayMax: 3000, // Reduced from 5000ms
        //     timeout: 10000, // Reduced from 20000ms
        //     forceNew: false,
        //     upgrade: true,
        //     rememberUpgrade: true
        // });

        const socket = io(`http://localhost:3000`, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 500, // Reduced from 1000ms
            reconnectionDelayMax: 3000, // Reduced from 5000ms
            timeout: 10000, // Reduced from 20000ms
            forceNew: false,
            upgrade: true,
            rememberUpgrade: true
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            if (!isMountedRef.current) return;
            
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttemptsRef.current = 0;
            
            // Join with user data and auto-join all chat rooms
            try {
                socket.emit('user_join', {
                    userId: user.id,
                    userRole: user.role,
                });

                // Auto-join all chat rooms when connected for persistent message receiving
                // Note: This is now handled by the Chat component to avoid duplicate API calls
                // The Chat component will handle joining rooms when it loads
            } catch (error) {
                console.warn('Error joining user:', error);
            }
        });

        socket.on('disconnect', (reason) => {
            if (!isMountedRef.current) return;
            
            setIsConnected(false);
            
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                try {
                    socket.connect();
                } catch (error) {
                    console.warn('Error reconnecting after server disconnect:', error);
                }
            }
        });

        socket.on('connect_error', (error) => {
            if (!isMountedRef.current) return;
            
            console.error('Socket connection error:', error);
            setIsConnected(false);
            setConnectionError(`Connection failed: ${error.message}`);
            
            // Attempt to reconnect with exponential backoff
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectAttemptsRef.current++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                        try {
                            socket.connect();
                        } catch (error) {
                            console.warn('Error during reconnection attempt:', error);
                        }
                    }
                }, delay);
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            if (!isMountedRef.current) return;
            
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttemptsRef.current = 0;
        });

        socket.on('reconnect_error', (error) => {
            if (!isMountedRef.current) return;
            
            console.error('Reconnection error:', error);
            setConnectionError(`Reconnection failed: ${error.message}`);
        });

        socket.on('reconnect_failed', () => {
            if (!isMountedRef.current) return;
            
            console.error('Failed to reconnect after maximum attempts');
            setConnectionError('Failed to reconnect. Please refresh the page.');
        });

        // Listen for new notifications (only if enabled)
        if (enableNotifications) {
            const handleNotification = (notificationData: any) => {
                if (!isMountedRef.current) return;
                
                // Add notification to Redux store
                dispatch(addNotification(notificationData));
                
                // Increment unread count if notification is unread
                if (!notificationData.is_read) {
                    dispatch(incrementUnreadCount());
                }
            };
            
            socket.on('new_notification', handleNotification);
            
            // Store cleanup function
            socket._cleanupNotification = () => {
                socket.off('new_notification', handleNotification);
            };
        }

        return socket;
    }, [user, enableNotifications]);

    // Component mount/unmount tracking
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            
            // Clear any pending timeouts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            // Disconnect socket
            if (socketRef.current) {
                try {
                    // Clean up notification listener if it exists
                    if (socketRef.current._cleanupNotification) {
                        socketRef.current._cleanupNotification();
                    }
                    socketRef.current.disconnect();
                    socketRef.current = null;
                } catch (error) {
                    console.warn('Error disconnecting socket during cleanup:', error);
                }
            }
        };
    }, []);

    useEffect(() => {
        const socket = initializeSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (socket) {
                try {
                    socket.disconnect();
                } catch (error) {
                    console.warn('Error disconnecting socket in effect cleanup:', error);
                }
            }
        };
    }, [initializeSocket]);

    // Manual reconnect function
    const reconnect = useCallback(() => {
        if (!isMountedRef.current) return;
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttemptsRef.current = 0;
        setConnectionError(null);
        initializeSocket();
    }, [initializeSocket]);

    // Join a chat room (only if chat is enabled)
    const joinRoom = useCallback((roomId: string) => {
        if (!isMountedRef.current || !enableChat) return;
        
        if (socketRef.current && isConnected) {
            try {
                socketRef.current.emit('join_room', roomId);
            } catch (error) {
                console.warn('Error joining room:', error);
            }
        }
    }, [isConnected, enableChat]);

    // Leave a chat room (only if chat is enabled)
    const leaveRoom = useCallback((roomId: string) => {
        if (!isMountedRef.current || !enableChat) return;
        
        if (socketRef.current && isConnected) {
            try {
                socketRef.current.emit('leave_room', roomId);
            } catch (error) {
                console.warn('Error leaving room:', error);
            }
        }
    }, [isConnected, enableChat]);

    // Send a message - This now returns the message for immediate UI update
    const sendMessage = useCallback(async (roomId: string, message: string, file?: File): Promise<Message> => {
        if (!socketRef.current || !isConnected || !user || !isMountedRef.current || !enableChat) {
            throw new Error('Socket not connected or user not authenticated');
        }

        try {
            let messageData: Message;

            if (file) {
                // Handle file upload using apiClient
                const formData = new FormData();
                formData.append('room_id', roomId);
                formData.append('file', file);

                const response = await apiClient.post('/chat/messages', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                messageData = response.data.data;
            } else {
                // Send text message using apiClient
                const response = await apiClient.post('/chat/messages', {
                    room_id: roomId,
                    message,
                });

                messageData = response.data.data;
            }

            // Socket event is now handled by backend for better reliability

            return messageData;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [isConnected, user, enableChat]);

    // Start typing indicator
    const startTyping = useCallback((roomId: string) => {
        if (!socketRef.current || !isConnected || !user || !isMountedRef.current || !enableChat) return;

        try {
            socketRef.current.emit('typing_start', {
                roomId,
                userId: user.id,
                userName: user.name,
            });
        } catch (error) {
            console.warn('Error starting typing indicator:', error);
        }
    }, [isConnected, user, enableChat]);

    // Stop typing indicator
    const stopTyping = useCallback((roomId: string) => {
        if (!socketRef.current || !isConnected || !user || !isMountedRef.current || !enableChat) return;

        try {
            socketRef.current.emit('typing_stop', {
                roomId,
                userId: user.id,
                userName: user.name,
            });
        } catch (error) {
            console.warn('Error stopping typing indicator:', error);
        }
    }, [isConnected, user, enableChat]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(async (roomId: string, messageIds: number[]): Promise<void> => {
        if (!user || !isMountedRef.current || !enableChat) {
            console.warn('Cannot mark messages as read: user not authenticated or chat disabled');
            return;
        }

        if (!socketRef.current || !isConnected) {
            console.warn('Socket not connected, marking messages as read via API only');
        }

        try {
            // Update read status via API
            await apiClient.post('/chat/mark-read', {
                room_id: roomId,
                message_ids: messageIds,
            });

            // Emit socket event for real-time updates
            socketRef.current.emit('mark_read', {
                roomId,
                messageIds,
                userId: user.id,
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }, [isConnected, user, enableChat]);

    // Set up message read callback
    const onMessagesRead = useCallback((callback: (data: { roomId: string; messageIds: number[]; readBy: number; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleMessagesRead = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('messages_read', handleMessagesRead);

        // Return cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.off('messages_read', handleMessagesRead);
            }
        };
    }, [enableChat]);

    // Set up offer created callback
    const onOfferCreated = useCallback((callback: (data: { roomId: string; offerData: any; senderId: number; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleOfferCreated = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('offer_created', handleOfferCreated);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('offer_created', handleOfferCreated);
            }
        };
    }, [enableChat]);

    // Set up offer accepted callback
    const onOfferAccepted = useCallback((callback: (data: { roomId: string; offerData: any; contractData: any; senderId: number; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleOfferAccepted = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('offer_accepted', handleOfferAccepted);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('offer_accepted', handleOfferAccepted);
            }
        };
    }, [enableChat]);

    // Set up offer rejected callback
    const onOfferRejected = useCallback((callback: (data: { roomId: string; offerData: any; senderId: number; rejectionReason?: string; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleOfferRejected = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('offer_rejected', handleOfferRejected);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('offer_rejected', handleOfferRejected);
            }
        };
    }, [enableChat]);

    // Set up offer cancelled callback
    const onOfferCancelled = useCallback((callback: (data: { roomId: string; offerData: any; senderId: number; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleOfferCancelled = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('offer_cancelled', handleOfferCancelled);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('offer_cancelled', handleOfferCancelled);
            }
        };
    }, [enableChat]);

    // Set up contract completed callback
    const onContractCompleted = useCallback((callback: (data: { roomId: string; contractData: any; senderId: number; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleContractCompleted = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('contract_completed', handleContractCompleted);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('contract_completed', handleContractCompleted);
            }
        };
    }, [enableChat]);

    // Set up contract terminated callback
    const onContractTerminated = useCallback((callback: (data: { roomId: string; contractData: any; senderId: number; terminationReason?: string; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleContractTerminated = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('contract_terminated', handleContractTerminated);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('contract_terminated', handleContractTerminated);
            }
        };
    }, [enableChat]);

    // Set up contract activated callback
    const onContractActivated = useCallback((callback: (data: { roomId: string; contractData: any; senderId: number; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleContractActivated = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('contract_activated', handleContractActivated);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('contract_activated', handleContractActivated);
            }
        };
    }, [enableChat]);

    // Set up offer acceptance message callback
    const onOfferAcceptanceMessage = useCallback((callback: (data: { roomId: string; offerData: any; contractData: any; senderId: number; senderName: string; senderAvatar?: string; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleOfferAcceptanceMessage = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('offer_acceptance_message', handleOfferAcceptanceMessage);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('offer_acceptance_message', handleOfferAcceptanceMessage);
            }
        };
    }, [enableChat]);

    // Set up contract status update callback
    const onContractStatusUpdate = useCallback((callback: (data: { roomId: string; contractData: any; terminationReason?: string; timestamp: string }) => void) => {
        if (!socketRef.current || !enableChat) return;

        const handleContractStatusUpdate = (data: any) => {
            if (!isMountedRef.current) return;
            callback(data);
        };

        socketRef.current.on('contract_status_update', handleContractStatusUpdate);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('contract_status_update', handleContractStatusUpdate);
            }
        };
    }, [enableChat]);

    // Send offer acceptance message
    const sendOfferAcceptanceMessage = useCallback((roomId: string, offerData: any, contractData: any, senderId: number, senderName: string, senderAvatar?: string) => {
        if (!socketRef.current || !isConnected || !isMountedRef.current || !enableChat) {
            return;
        }

        try {
            socketRef.current.emit('send_offer_acceptance_message', {
                roomId,
                offerData,
                contractData,
                senderId,
                senderName,
                senderAvatar,
            });
        } catch (error) {
            console.error('Error sending offer acceptance message:', error);
        }
    }, [isConnected, enableChat]);

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        markMessagesAsRead,
        onMessagesRead,
        onOfferCreated,
        onOfferAccepted,
        onOfferRejected,
        onOfferCancelled,
        onContractCompleted,
        onContractTerminated,
        onContractActivated,
        onContractStatusUpdate,
        sendOfferAcceptanceMessage,
        reconnect,
    };
}; 