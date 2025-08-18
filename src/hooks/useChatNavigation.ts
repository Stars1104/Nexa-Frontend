import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { useToast } from '../hooks/use-toast';

interface UseChatNavigationReturn {
    createChatRoom: (campaignId: number, creatorId: number) => Promise<string>;
    navigateToChat: (roomId: string) => void;
    navigateToChatWithRoom: (campaignId: number, creatorId: number) => Promise<void>;
}

export const useChatNavigation = (): UseChatNavigationReturn => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const createChatRoom = useCallback(async (campaignId: number, creatorId: number): Promise<string> => {
        try {
            const response = await chatService.createChatRoom(campaignId, creatorId);
            return response.room_id;
        } catch (error) {
            console.error('Error creating chat room:', error);
            toast({
                title: "Erro",
                description: "Falha ao criar sala de chat",
                variant: "destructive",
            });
            throw error;
        }
    }, [toast]);

    const navigateToChat = useCallback((roomId: string) => {
        navigate(`/creator/chat?room=${roomId}`);
    }, [navigate]);

    const navigateToChatWithRoom = useCallback(async (campaignId: number, creatorId: number) => {
        try {
            const roomId = await createChatRoom(campaignId, creatorId);
            navigateToChat(roomId);
        } catch (error) {
            console.error('Error navigating to chat with room:', error);
            toast({
                title: "Erro",
                description: "Falha ao navegar para o chat",
                variant: "destructive",
            });
            throw error;
        }
    }, [createChatRoom, navigateToChat, toast]);

    return {
        createChatRoom,
        navigateToChat,
        navigateToChatWithRoom,
    };
}; 