import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { useToast } from '../hooks/use-toast';

interface UseBrandChatNavigationReturn {
    createChatRoom: (campaignId: number, creatorId: number) => Promise<string>;
    navigateToChat: (roomId?: string) => void;
    navigateToChatWithRoom: (campaignId: number, creatorId: number, setComponent: (component: string | { name: string; campaign?: any; creatorId?: string }) => void) => Promise<void>;
}

export const useBrandChatNavigation = (): UseBrandChatNavigationReturn => {
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
        navigate(`/brand/chat?room=${roomId}`);
    }, [navigate]);

    const navigateToChatWithRoom = useCallback(async (campaignId: number, creatorId: number, setComponent: (component: string | { name: string; campaign?: any; creatorId?: string }) => void) => {
        try {
            const roomId = await createChatRoom(campaignId, creatorId);
            // Store the room ID in localStorage so ChatPage can automatically select it
            localStorage.setItem("selectedChatRoom", roomId);
            // Use setComponent to navigate to Chat component with room ID
            setComponent({
                name: "Chat",
                campaign: { id: campaignId },
                creatorId: creatorId.toString()
            });
        } catch (error) {
            console.error('Error navigating to chat with room:', error);
            toast({
                title: "Erro",
                description: "Falha ao navegar para o chat",
                variant: "destructive",
            });
            throw error;
        }
    }, [createChatRoom, toast]);

    return {
        createChatRoom,
        navigateToChat,
        navigateToChatWithRoom,
    };
}; 