import { apiClient } from './apiClient';

export interface ChatRoom {
    id: number;
    room_id: string;
    campaign_id: number;
    campaign_title: string;
    campaign_status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    other_user: {
        id: number;
        name: string;
        avatar?: string;
    };
    last_message?: {
        id: number;
        message: string;
        message_type: 'text' | 'file' | 'image' | 'offer' | 'system' | 'contract_completion';
        sender_id: number;
        is_sender: boolean;
        created_at: string;
    };
    unread_count: number;
    last_message_at?: string;
}

export interface Message {
    id: number;
    message: string;
    message_type: 'text' | 'file' | 'image' | 'offer' | 'system' | 'contract_completion';
    sender_id: number;
    sender_name: string;
    sender_avatar?: string;
    is_sender: boolean;
    file_path?: string;
    file_name?: string;
    file_size?: string;
    file_type?: string;
    file_url?: string;
    formatted_file_size?: string;
    is_read: boolean;
    read_at?: string;
    created_at: string;
    offer_data?: {
        offer_id: number;
        title: string;
        description: string;
        budget: string;
        formatted_budget: string;
        estimated_days: number;
        status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
        expires_at: string;
        days_until_expiry: number;
        sender: {
            id: number;
            name: string;
            avatar_url?: string;
        };
        contract_id?: number;
        contract_status?: string;
        can_be_completed?: boolean;
        rejection_reason?: string;
        termination_type?: string;
        cancelled_at?: string;
        cancellation_reason?: string;
    };
}

export interface ConnectionRequest {
    id: number;
    sender: { id: number; name: string; avatar?: string };
    receiver: { id: number; name: string; avatar?: string };
    message?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    campaign?: { id: number; title: string };
    created_at: string;
}

export interface ChatRoomResponse {
    room: {
        id: number;
        room_id: string;
        campaign_id: number;
        campaign_title: string;
    };
    messages: Message[];
}

class ChatService {
    // Get user's chat rooms (campaign-based)
    async getChatRooms(): Promise<ChatRoom[]> {
        try {
            const response = await apiClient.get('/chat/rooms');
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    // Get messages for a specific chat room
    async getMessages(roomId: string): Promise<ChatRoomResponse> {
        const timestamp = Date.now(); // Cache-busting parameter
        const url = `/chat/rooms/${roomId}/messages?t=${timestamp}`;
        
        try {
            const response = await apiClient.get(url);
            return response.data.data;
        } catch (error) {
            console.error('[ChatService] Error getting messages:', error);
            throw error;
        }
    }

    // Send a text message
    async sendTextMessage(roomId: string, message: string): Promise<Message> {
        const response = await apiClient.post('/chat/messages', {
            room_id: roomId,
            message,
        });
        return response.data.data;
    }

    // Send a file message
    async sendFileMessage(roomId: string, file: File): Promise<Message> {
        const formData = new FormData();
        formData.append('room_id', roomId);
        formData.append('file', file);

        const response = await apiClient.post('/chat/messages', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }

    // Create a chat room (when brand accepts creator proposal)
    async createChatRoom(campaignId: number, creatorId: number): Promise<{ room_id: string }> {
        const response = await apiClient.post('/chat/rooms', {
            campaign_id: campaignId,
            creator_id: creatorId,
        });
        return response.data.data;
    }

    // Update typing status
    async updateTypingStatus(roomId: string, isTyping: boolean): Promise<void> {
        await apiClient.post('/chat/typing-status', {
            room_id: roomId,
            is_typing: isTyping,
        });
    }

    // Mark messages as read
    async markMessagesAsRead(roomId: string, messageIds: number[]): Promise<void> {
        await apiClient.post('/chat/mark-read', {
            room_id: roomId,
            message_ids: messageIds,
        });
    }

    // Send guide messages when user first enters chat
    async sendGuideMessages(roomId: string): Promise<void> {
        const response = await apiClient.post(`/chat/rooms/${roomId}/send-guide-messages`);
    }

    // Download file with CORS handling
    async downloadFile(fileUrl: string, fileName: string): Promise<Blob> {
        try {
            // Try direct fetch with no-cors mode first
            const response = await fetch(fileUrl, {
                method: 'GET',
                mode: 'no-cors', // This allows us to get the response even with CORS issues
                credentials: 'include',
                headers: {
                    'Accept': '*/*',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                }
            });
            
            if (response.type === 'opaque') {
                // If we get an opaque response, we can't access the blob directly
                // This means CORS is blocking us, so we'll throw an error to trigger fallback
                throw new Error('CORS blocked - using fallback method');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.blob();
        } catch (error) {
            console.warn('Direct fetch failed, will use fallback methods:', error);
            throw error;
        }
    }

    // Get connection requests
    async getConnectionRequests(type: 'received' | 'sent'): Promise<{ data: ConnectionRequest[] }> {
        const response = await apiClient.get(`/connection-requests?type=${type}`);
        return response.data;
    }

    // Accept connection request
    async acceptConnectionRequest(requestId: number): Promise<any> {
        const response = await apiClient.post(`/connection-requests/${requestId}/accept`);
        return response.data;
    }

    // Reject connection request
    async rejectConnectionRequest(requestId: number): Promise<any> {
        const response = await apiClient.post(`/connection-requests/${requestId}/reject`);
        return response.data;
    }

    // Cancel connection request
    async cancelConnectionRequest(requestId: number): Promise<any> {
        const response = await apiClient.post(`/connection-requests/${requestId}/cancel`);
        return response.data;
    }
}

export const chatService = new ChatService(); 