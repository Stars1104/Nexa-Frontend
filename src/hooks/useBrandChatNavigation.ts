import { useCallback } from 'react';
import { chatService } from '../services/chatService';
import { toast } from 'sonner';

interface UseBrandChatNavigationReturn {
    createChatRoom: (campaignId: number, creatorId: number) => Promise<string>;
    navigateToChat: (roomId?: string) => void;
    navigateToChatWithRoom: (campaignId: number, creatorId: number, setComponent: (component: string) => void) => Promise<void>;
}

export const useBrandChatNavigation = (): UseBrandChatNavigationReturn => {
    const createChatRoom = useCallback(async (campaignId: number, creatorId: number): Promise<string> => {
        try {
            const response = await chatService.createChatRoom(campaignId, creatorId);
            return response.room_id;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    }, []);

    const navigateToChat = useCallback((roomId?: string) => {
        // For brand navigation, we just set the component to "Chat"
        // The ChatPage component will handle loading the appropriate room
        return "Chat";
    }, []);

    const navigateToChatWithRoom = useCallback(async (campaignId: number, creatorId: number, setComponent: (component: string) => void) => {
        try {
            const roomId = await createChatRoom(campaignId, creatorId);
            setComponent("Chat");
            // You could also store the roomId in localStorage or state for the ChatPage to use
            localStorage.setItem('selectedChatRoom', roomId);
        } catch (error: any) {
            console.error('Error navigating to chat with room:', error);
            
            // Provide user-friendly error message
            let errorMessage = 'Failed to create chat room. Please try again.';
            
            if (error.response?.status === 419) {
                errorMessage = 'Session expired. Please refresh the page and try again.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.response?.status === 404) {
                errorMessage = 'No approved application found for this creator.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            // Show user-friendly error message
            toast.error(errorMessage);
            throw error;
        }
    }, [createChatRoom]);

    return {
        createChatRoom,
        navigateToChat,
        navigateToChatWithRoom,
    };
}; 