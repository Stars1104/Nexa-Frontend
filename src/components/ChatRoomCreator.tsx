import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { MessageCircle, User, Calendar } from 'lucide-react';
import { chatService } from '../services/chatService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Application {
    id: number;
    creator: {
        id: number;
        name: string;
        avatar?: string;
        email: string;
    };
    campaign: {
        id: number;
        title: string;
    };
    status: string;
    created_at: string;
}

interface ChatRoomCreatorProps {
    application: Application;
    onChatCreated?: (roomId: string) => void;
    className?: string;
}

export default function ChatRoomCreator({ application, onChatCreated, className }: ChatRoomCreatorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleCreateChat = async () => {
        try {
            setIsCreating(true);
            setError(null);

            // Create chat room
            const response = await chatService.createChatRoom(
                application.campaign.id,
                application.creator.id
            );

            // Close dialog
            setIsOpen(false);

            // Callback to parent component
            if (onChatCreated) {
                onChatCreated(response.room_id);
            }

            // Navigate to chat page with the new room
            navigate(`/creator/chat?room=${response.room_id}`);

        } catch (error: any) {
            console.error('Error creating chat room:', error);
            setError(error.response?.data?.message || 'Failed to create chat room');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0",
                        className
                    )}
                >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Start Chat with Creator
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* Creator Info */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={application.creator.avatar} />
                            <AvatarFallback>{application.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {application.creator.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {application.creator.email}
                            </p>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                            {application.status}
                        </Badge>
                    </div>

                    {/* Campaign Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Campaign Details
                        </h4>
                        <div className="space-y-1 text-sm">
                            <p className="text-blue-800 dark:text-blue-200">
                                <strong>Title:</strong> {application.campaign.title}
                            </p>
                            <p className="text-blue-700 dark:text-blue-300">
                                <strong>Application Date:</strong> {new Date(application.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium mb-1">Chat Room Creation</p>
                                <p>
                                    This will create a dedicated chat room for you and {application.creator.name} 
                                    to discuss the campaign "{application.campaign.title}".
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="flex-1"
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateChat}
                            disabled={isCreating}
                            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        >
                            {isCreating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Start Chat
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 