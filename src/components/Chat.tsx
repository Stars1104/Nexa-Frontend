import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import CampaignTimelineSidebar from "./CampaignTimelineSidebar";
import {
  SearchIcon,
  Send,
  Paperclip,
  File,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Check,
  Clock,
  Download,
  MoreVertical,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Star,
  XCircle,
  FileText
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { chatService, ChatRoom, Message } from "../services/chatService";
import { useAppSelector } from "../store/hooks";
import { format, isToday, isYesterday } from "date-fns";
import ChatOfferMessage, { ChatOffer } from "./ChatOfferMessage";
import ContractCompletionMessage from "./ContractCompletionMessage";
import { hiringApi } from "../api/hiring";
import { useToast } from "../hooks/use-toast";
import ReviewModal from "./creator/ReviewModal";
import BrandReviewModal from "./brand/ReviewModal";
import CampaignFinalizationModal from "./brand/CampaignFinalizationModal";

export default function Chat() {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isCurrentUserTyping, setIsCurrentUserTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set());

  // Contract-related state
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  // Review-related state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contractToReview, setContractToReview] = useState<any>(null);

  // Brand review modal state
  const [showBrandReviewModal, setShowBrandReviewModal] = useState(false);
  const [brandContractToReview, setBrandContractToReview] = useState<any>(null);

  // Campaign finalization modal state
  const [showCampaignFinalizationModal, setShowCampaignFinalizationModal] = useState(false);
  const [contractToFinalize, setContractToFinalize] = useState<any>(null);

  // Timeline-related state
  const [showTimelineSidebar, setShowTimelineSidebar] = useState(false);

  // Image viewer state
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    imageUrl: string;
    imageName: string;
    imageSize?: string;
  }>({
    isOpen: false,
    imageUrl: "",
    imageName: "",
    imageSize: "",
  });
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const imageViewerRef = useRef<HTMLDivElement>(null);

  // Socket.IO hook
  const {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    reconnect,
    onMessagesRead,
    sendOfferAcceptanceMessage,
  } = useSocket({ enableNotifications: false, enableChat: true });

  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Clear any pending timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Load chat rooms on component mount
  useEffect(() => {
    if (isMountedRef.current) {
      loadChatRooms();
    }

    // Cleanup function to stop typing indicators when component unmounts
    return () => {
      if (selectedRoom && isCurrentUserTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setIsCurrentUserTyping(false);
        stopTyping(selectedRoom.room_id);
      }
    };
  }, [selectedRoom]);

  // Auto-join room when selectedRoom changes
  useEffect(() => {
    if (selectedRoom && isConnected) {
      joinRoom(selectedRoom.room_id);
    }
  }, [selectedRoom, isConnected, joinRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Use requestAnimationFrame to ensure DOM is ready
    const scrollToBottom = () => {
      if (messagesEndRef.current && isMountedRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
          console.warn("Error scrolling to bottom:", error);
        }
      }
    };

    requestAnimationFrame(scrollToBottom);
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isMountedRef.current) return;

    // Listen for new messages from other users
    const handleNewMessage = (data: any) => {
      if (!isMountedRef.current) return;

      if (data.roomId === selectedRoom?.room_id) {
        // Add message from any user (including current user for synchronization)
        const messageId = data.messageId || Date.now() + Math.floor(Math.random() * 1000);
        const isFromCurrentUser = data.senderId === user?.id;
        
        const newMessage: Message = {
          id: messageId,
          message: data.message,
          message_type: data.messageType || "text",
          sender_id: data.senderId,
          sender_name: data.senderName,
          sender_avatar: data.senderAvatar,
          is_sender: isFromCurrentUser, // Set based on whether it's from current user
          file_path: data.fileData?.file_path,
          file_name: data.fileData?.file_name,
          file_size: data.fileData?.file_size,
          file_type: data.fileData?.file_type,
          file_url: data.fileData?.file_url,
          is_read: isFromCurrentUser, // Mark as read if from current user
          created_at: data.timestamp || new Date().toISOString(),
          offer_data: data.offerData, // Map socket offerData to offer_data
        };

        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            console.warn('Attempted to add duplicate socket message:', newMessage.id);
            return prev;
          }
          
          // Check if this is a recently sent message by current user to avoid duplicates
          if (isFromCurrentUser && (window as any).lastSentMessageId === newMessage.id) {
            return prev;
          }
          
          return [...prev, newMessage];
        });

        // Mark as read immediately if it's not from current user
        if (!isFromCurrentUser) {
          markMessagesAsRead(data.roomId, [messageId]).catch((error) => {
            console.warn("Error marking message as read:", error);
          });
        }
      }

      // Update conversation list
      loadChatRooms();
    };

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (!isMountedRef.current) return;

      if (data.roomId === selectedRoom?.room_id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userName);
          } else {
            newSet.delete(data.userName);
          }
          return newSet;
        });
      }
    };

    // Listen for read receipts from other users
    const handleMessagesRead = (data: any) => {
      if (!isMountedRef.current) return;

      if (data.roomId === selectedRoom?.room_id) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg.id)
              ? { ...msg, is_read: true, read_at: data.timestamp }
              : msg
          )
        );
      }
    };

    // Listen for offer acceptance confirmation messages
    const handleOfferAcceptanceMessage = (data: any) => {
      if (!isMountedRef.current) return;

      if (data.roomId === selectedRoom?.room_id) {
        // Add the acceptance confirmation message to the chat
        const confirmationMessage: Message = {
          id: Date.now(), // Temporary ID
          message: `✅ Oferta aceita com sucesso! Contrato criado.`,
          message_type: 'text',
          sender_id: data.senderId,
          sender_name: data.senderName,
          sender_avatar: data.senderAvatar,
          is_sender: data.senderId === user?.id,
          is_read: false,
          created_at: data.timestamp,
        };

        setMessages((prev) => [...prev, confirmationMessage]);

        // Scroll to bottom to show new message
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("offer_acceptance_message", handleOfferAcceptanceMessage);

    return () => {
      try {
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleUserTyping);
        socket.off("messages_read", handleMessagesRead);
        socket.off("offer_acceptance_message", handleOfferAcceptanceMessage);
      } catch (error) {
        console.warn("Error removing socket listeners:", error);
      }
    };
  }, [socket, selectedRoom, user, markMessagesAsRead]);

  // Listen for read receipt updates from other users using the new hook function
  useEffect(() => {
    if (!isMountedRef.current) return;

    const cleanup = onMessagesRead((data) => {
      if (data.roomId === selectedRoom?.room_id) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg.id)
              ? { ...msg, is_read: true, read_at: data.timestamp }
              : msg
          )
        );
      }
    });

    return cleanup;
  }, [onMessagesRead, selectedRoom]);

  // Auto-clear typing users after 3 seconds to prevent them from persisting
  useEffect(() => {
    if (typingUsers.size > 0) {
      const timeoutId = setTimeout(() => {
        setTypingUsers(new Set());
      }, 3000); // Clear after 3 seconds

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [typingUsers]);

  // Clear typing users when room changes
  useEffect(() => {
    setTypingUsers(new Set());
  }, [selectedRoom?.room_id]);

  // Load chat rooms from API
  const loadChatRooms = async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await chatService.getChatRooms();
      if (isMountedRef.current) {
        const roomsData = response || [];
        setChatRooms(roomsData);

        // Auto-select first room if none selected and rooms exist
        if (!selectedRoom && roomsData.length > 0) {
          handleConversationSelect(roomsData[0]);
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar salas de chat",
        variant: "destructive",
      });
    }
  };

  // Create guide messages for a specific room (returns array, doesn't modify state)
  const createGuideMessages = (room: ChatRoom): Message[] => {
    try {
      const isBrand = user?.role === 'brand';
      
      let guideMessage = '';
      if (isBrand) {
        guideMessage = "🎉 **Parabéns pela parceria iniciada com uma criadora da nossa plataforma!**\n\n" +
          "Para garantir o melhor resultado possível, é essencial que você oriente a criadora com detalhamento e clareza sobre como deseja que o conteúdo seja feito. **Quanto mais específica for a comunicação, maior será a qualidade da entrega.**\n\n" +
          "**📋 Próximos Passos Importantes:**\n\n" +
          "• **💰 Saldo da Campanha:** Insira o valor da campanha na aba \"Saldo\" da plataforma\n" +
          "• **✅ Aprovação de Conteúdo:** Avalie o roteiro antes da gravação para garantir alinhamento\n" +
          "• **🎬 Entrega Final:** Após receber o conteúdo pronto e editado, libere o pagamento\n" +
          "• **⭐ Finalização:** Clique em \"Finalizar Campanha\" e avalie o trabalho entregue\n" +
          "• **📝 Briefing:** Reforce os pontos principais com a criadora para alinhar com o objetivo da marca\n" +
          "• **🔄 Ajustes:** Permita até 2 pedidos de ajustes por vídeo caso necessário\n\n" +
          "**🔒 Regras de Segurança da Campanha:**\n\n" +
          "✅ **Comunicação Exclusiva:** Toda comunicação deve ser feita pelo chat da NEXA\n" +
          "❌ **Proteção de Dados:** Não compartilhe dados bancários, contatos pessoais ou WhatsApp\n" +
          "⚠️ **Cumprimento de Prazos:** Descumprimento pode resultar em advertência ou bloqueio\n" +
          "🚫 **Cancelamento:** Em caso de cancelamento, o produto deve ser solicitado de volta\n\n" +
          "**💼 A NEXA está aqui para facilitar conexões seguras e profissionais!**\n" +
          "Conte conosco para apoiar o sucesso da sua campanha! 📢✨";
      } else {
        guideMessage = "🩷 **Parabéns, você foi aprovada em mais uma campanha da NEXA!**\n\n" +
          "Estamos muito felizes em contar com você e esperamos que mostre toda sua criatividade, comprometimento e qualidade para representar bem a marca e a nossa plataforma.\n\n" +
          "**📋 Próximos Passos:**\n\n" +
          "• **Confirme seu endereço de envio** o quanto antes, para que o produto possa ser encaminhado sem atrasos\n" +
          "• **Entregue o roteiro da campanha** em até 5 dias úteis\n" +
          "• **Siga todas as orientações** da marca presentes no briefing\n" +
          "• **Aguarde a aprovação** do roteiro antes de gravar o conteúdo\n" +
          "• **Entregue o conteúdo final** em até 5 dias úteis após aprovação do roteiro\n" +
          "• **Envie o vídeo com qualidade profissional** - até 2 solicitações de ajustes serão permitidas\n" +
          "• **Mantenha retorno rápido** nas mensagens dentro do chat da plataforma\n\n" +
          "**⚠️ Regras Importantes:**\n\n" +
          "✅ **Toda a comunicação** deve acontecer exclusivamente pelo chat da NEXA\n" +
          "❌ **Não compartilhe** dados bancários, e-mails ou número de WhatsApp\n" +
          "⚠️ **Descumprimento** dos prazos ou regras pode resultar em penalizações\n" +
          "🚫 **Em caso de cancelamento**, o produto deve ser devolvido\n\n" +
          "**Boa campanha!** 💼💡";
      }
      
      const quoteMessage = "💼 **Detalhes da Campanha:**\n\n" +
        "**Status:** 🟢 Conectado\n\n" +
        "Você está agora conectado e pode começar a conversar. **Use o chat para todas as comunicações** e siga as diretrizes da plataforma para uma parceria de sucesso.";
      
      // Create guide message with unique IDs using room-specific approach
      const roomSpecificId = parseInt(room.room_id.replace(/\D/g, '')) || 0;
      const uniqueTimestamp = Date.now();
      const guideMsg: Message = {
        id: -(1000000000 + roomSpecificId * 1000 + 1), // Negative ID to avoid conflicts with real messages
        message: guideMessage,
        message_type: 'system',
        sender_id: user?.id || 0,
        sender_name: user?.name || 'Sistema',
        sender_avatar: user?.avatar_url,
        is_sender: false,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      
      // Create quote message
      const quoteMsg: Message = {
        id: -(1000000000 + roomSpecificId * 1000 + 2), // Negative ID to avoid conflicts with real messages
        message: quoteMessage,
        message_type: 'system',
        sender_id: user?.id || 0,
        sender_name: user?.name || 'Sistema',
        sender_avatar: user?.avatar_url,
        is_sender: false,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      
      return [guideMsg, quoteMsg];
    } catch (error) {
      console.error('[Chat] Error creating guide messages:', error);
      return [];
    }
  };

    // Load messages for a specific room
  const loadMessages = async (room: ChatRoom) => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      const response = await chatService.getMessages(room.room_id);
      if (isMountedRef.current) {

        // Deduplicate messages by ID to prevent duplicate key warnings
        const messageIds = new Set();
        const deduplicatedMessages = response.messages.filter((message) => {
          if (messageIds.has(message.id)) {
            console.warn('Duplicate message ID detected in API response:', message.id, message);
            return false; // Skip duplicate message IDs
          }
          messageIds.add(message.id);
          return true;
        });

        // Check if guide messages need to be added after API response
        const existingGuideMessages = deduplicatedMessages.filter(msg => 
          msg.message_type === 'system' && 
          (msg.message.includes('Parabéns') || msg.message.includes('parceria'))
        );
        
        const guideMessagesKey = `guide_messages_${room.room_id}`;
        const hasGuideMessagesInStorage = localStorage.getItem(guideMessagesKey);
        
        // Add guide messages if they don't exist in API response and haven't been added before
        if (existingGuideMessages.length === 0) { // && !hasGuideMessagesInStorage) {
          // Add guide messages directly to the deduplicated messages before setting state
          const guideMessages = createGuideMessages(room);
          const messagesWithGuides = [...guideMessages, ...deduplicatedMessages];
          
          // Final deduplication check for the combined array
          const allMessageIds = new Set();
          const finalMessages = messagesWithGuides.filter((message) => {
            if (allMessageIds.has(message.id)) {
              console.warn('Duplicate message ID in final array:', message.id);
              return false;
            }
            allMessageIds.add(message.id);
            return true;
          });
          
          setMessages(finalMessages);
          // Mark that this room has received guide messages
          localStorage.setItem(guideMessagesKey, 'true');
        } else {
          // Set messages normally
          setMessages(deduplicatedMessages);
          if (existingGuideMessages.length > 0) {
            // Mark that guide messages exist in this room
            localStorage.setItem(guideMessagesKey, 'true');
          }
        }

        // Join the room for real-time updates
        joinRoom(room.room_id);

        // Mark all unread messages from other users as read
        const unreadMessages = deduplicatedMessages.filter(
          (msg) => !msg.is_sender && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          try {
            await markMessagesAsRead(
              room.room_id,
              unreadMessages.map((msg) => msg.id)
            );
          } catch (error) {
            console.warn('Failed to mark messages as read:', error);
            // Don't show toast for this error as it's not critical
          }
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar mensagens",
        variant: "destructive",
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Load contracts for the selected room
  const loadContracts = async (roomId: string) => {
    if (!isMountedRef.current) return;

    try {
      setIsLoadingContracts(true);
      const response = await hiringApi.getContractsForChatRoom(roomId);
      const contractsData = response.data;

      if (isMountedRef.current) {
        // Fetch review status for each contract
        const contractsWithReviewStatus = await Promise.all(
          contractsData.map(async (contract: any) => {
            try {
              const reviewStatusResponse =
                await hiringApi.getContractReviewStatus(contract.id);
              return {
                ...contract,
                ...reviewStatusResponse.data,
              };
            } catch (error) {
              // Handle error silently for individual contract review status
              return contract;
            }
          })
        );

        setContracts(contractsWithReviewStatus);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar contratos",
        variant: "destructive",
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoadingContracts(false);
      }
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (room: ChatRoom) => {
    if (!isMountedRef.current) return;

    // Stop typing indicator for previous room
    if (selectedRoom && isCurrentUserTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsCurrentUserTyping(false);
      stopTyping(selectedRoom.room_id);
    }

    // Clear typing users for previous room
    setTypingUsers(new Set());

    // Leave previous room
    if (selectedRoom) {
      leaveRoom(selectedRoom.room_id);
    }

    setSelectedRoom(room);
    setSidebarOpen(false);

    // Load messages for the selected room
    await loadMessages(room);

    // Load contracts for the selected room
    await loadContracts(room.room_id);



    // Focus input
    setTimeout(() => {
      if (inputRef.current && isMountedRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || (!input.trim() && !selectedFile)) return;

    try {
      let newMessage: Message;

      if (selectedFile) {
        newMessage = await sendMessage(
          selectedRoom.room_id,
          input.trim() || selectedFile.name,
          selectedFile
        );
        if (isMountedRef.current) {
          setSelectedFile(null);
          setFilePreview(null);
        }
      } else {
        newMessage = await sendMessage(selectedRoom.room_id, input.trim());
      }

      if (isMountedRef.current) {
        // Add the message to the UI immediately for better UX
        // The message from the API response is already complete with proper ID
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            console.warn('Attempted to add duplicate sent message:', newMessage.id);
            return prev;
          }
          return [...prev, newMessage];
        });
        
        // Mark the message as sent via socket to prevent duplicate handling
        if (newMessage.id) {
          (window as any).lastSentMessageId = newMessage.id;
        }
        setInput("");

        // Stop typing indicator immediately when message is sent
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setIsCurrentUserTyping(false);
        stopTyping(selectedRoom.room_id);

        // Focus input after sending
        setTimeout(() => {
          if (inputRef.current && isMountedRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMountedRef.current) return;

    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (isMountedRef.current) {
            setFilePreview(e.target?.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle input change with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMountedRef.current) return;

    setInput(e.target.value);

    // Handle typing indicators
    if (selectedRoom) {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Start typing indicator immediately when user types
      if (!isCurrentUserTyping) {
        setIsCurrentUserTyping(true);
        startTyping(selectedRoom.room_id);
      }

      // Set timeout to stop typing indicator 1 second after user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          stopTyping(selectedRoom.room_id);
          setIsCurrentUserTyping(false);
        }
      }, 1000); // 1 second delay after stopping
    }
  };

  // Handle when user stops typing (keyup event)
  const handleKeyUp = () => {
    if (!isMountedRef.current || !selectedRoom) return;

    // Set a shorter timeout for immediate response when user stops pressing keys
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isCurrentUserTyping) {
        stopTyping(selectedRoom.room_id);
        setIsCurrentUserTyping(false);
      }
    }, 500); // Shorter timeout for keyup events
  };

  // Handle when input loses focus
  const handleInputBlur = () => {
    if (!isMountedRef.current || !selectedRoom) return;

    // Stop typing indicator immediately when input loses focus
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isCurrentUserTyping) {
      setIsCurrentUserTyping(false);
      stopTyping(selectedRoom.room_id);
    }
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    if (!sidebarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!isMountedRef.current) return;

      const sidebar = document.querySelector("[data-sidebar]");
      const hamburger = document.querySelector("[data-hamburger]");

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        hamburger &&
        !hamburger.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (!isMountedRef.current) return;

      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen]);

  // Cleanup typing indicators when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedRoom && isCurrentUserTyping) {
        stopTyping(selectedRoom.room_id);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && selectedRoom && isCurrentUserTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setIsCurrentUserTyping(false);
        stopTyping(selectedRoom.room_id);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup typing indicators on unmount
      if (selectedRoom && isCurrentUserTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setIsCurrentUserTyping(false);
        stopTyping(selectedRoom.room_id);
      }
    };
  }, [selectedRoom, isCurrentUserTyping, stopTyping]);

  // Image Viewer Component
  const ImageViewer = () => {
    const handleClose = () => {
      setImageViewer({
        isOpen: false,
        imageUrl: "",
        imageName: "",
        imageSize: "",
      });
      setImageZoom(1);
      setImageRotation(0);
    };

    const handleZoomIn = () => {
      setImageZoom((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
      setImageZoom((prev) => Math.max(prev - 0.25, 0.25));
    };

    const handleRotate = () => {
      setImageRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
      setImageZoom(1);
      setImageRotation(0);
    };

    const handleDownload = async () => {
      try {
        await downloadImageToLocal(imageViewer.imageUrl, imageViewer.imageName);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao baixar imagem",
          variant: "destructive",
        });

        // Try fallback method
        try {
          const downloadUrl = imageViewer.imageUrl.replace(
            "/storage/",
            "/api/download/"
          );
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = imageViewer.imageName;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (fallbackError) {
          toast({
            title: "Erro",
            description: "Método alternativo também falhou",
            variant: "destructive",
          });
        }
      }
    };

    // Close on escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "Escape":
            handleClose();
            break;
          case "+":
          case "=":
            e.preventDefault();
            handleZoomIn();
            break;
          case "-":
            e.preventDefault();
            handleZoomOut();
            break;
          case "r":
            e.preventDefault();
            handleRotate();
            break;
          case "0":
            e.preventDefault();
            handleReset();
            break;
          case "d":
            e.preventDefault();
            handleDownload();
            break;
        }
      };

      if (imageViewer.isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }, [imageViewer.isOpen]);

    if (!imageViewer.isOpen) return null;

    return createPortal(
      <div
        ref={imageViewerRef}
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={handleClose}
      >
        {/* Image Container */}
        <div
          className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageViewer.imageUrl}
            alt={imageViewer.imageName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{
              transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
              transition: "transform 0.3s ease-in-out",
            }}
            draggable={false}
          />
        </div>

        {/* Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl p-2 border border-white/20">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Rotate"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Reset"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
          <div className="text-white text-center">
            <div className="font-medium">{imageViewer.imageName}</div>
            {imageViewer.imageSize && (
              <div className="text-sm text-white/70">
                {imageViewer.imageSize}
              </div>
            )}
            <div className="text-sm text-white/70">
              Zoom: {Math.round(imageZoom * 100)}% | Rotation: {imageRotation}°
            </div>
            <div className="text-xs text-white/50 mt-1">
              Press + / - to zoom, R to rotate, 0 to reset, D to download, ESC
              to close
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Enhanced image download function with CORS handling
  const downloadImageToLocal = async (
    imageUrl: string,
    fileName: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Convert storage URL to API download URL
      const downloadUrl = imageUrl.replace("/storage/", "/api/download/");

      // Method 1: Try fetch first (handles CORS better)
      fetch(downloadUrl, {
        method: "GET",
        mode: "cors",
        credentials: "include", // Include cookies if needed
        headers: {
          Accept: "image/*,*/*;q=0.8",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const mimeType = getMimeType(fileName);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          link.setAttribute("download", fileName);
          link.setAttribute("type", mimeType);
          link.setAttribute(
            "data-downloadurl",
            `${mimeType}:${fileName}:${url}`
          );

          // Ensure the link is properly configured for download
          link.target = "_blank";
          link.rel = "noopener noreferrer";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);

          resolve();
        })
        .catch((fetchError) => {
          console.warn(
            "Fetch method failed, trying canvas method:",
            fetchError
          );

          // Method 2: Canvas method as fallback
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                  reject(new Error("Could not get canvas context"));
                  return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const mimeType = getMimeType(fileName);

                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = fileName;
                      link.style.display = "none";
                      link.setAttribute("download", fileName);
                      link.setAttribute("type", mimeType);
                      link.setAttribute(
                        "data-downloadurl",
                        `${mimeType}:${fileName}:${url}`
                      );

                      // Ensure the link is properly configured for download
                      link.target = "_blank";
                      link.rel = "noopener noreferrer";

                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                      }, 1000);

                      resolve();
                    } else {
                      reject(new Error("Failed to create blob from canvas"));
                    }
                  },
                  mimeType,
                  0.9
                );
              } catch (error) {
                reject(error);
              }
            };

            img.onerror = () => {
              console.warn("Canvas method also failed, trying direct link");

              // Method 3: Direct link as last resort
              try {
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = fileName;
                link.style.display = "none";
                link.setAttribute("download", fileName);
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                resolve();
              } catch (directError) {
                console.error("All download methods failed:", directError);
                reject(new Error("All download methods failed"));
              }
            };

            img.src = imageUrl;
          } catch (error) {
            reject(error);
          }
        });
    });
  };

  // File Dropdown Component
  const FileDropdown = ({ message }: { message: Message }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isOpen = openDropdowns.has(message.id);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">(
      "bottom"
    );

    const toggleDropdown = (e: React.MouseEvent) => {
      e.stopPropagation();

      // Check available space and determine dropdown position
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 150; // Increased height estimate

      // If there's not enough space below, show above
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // More aggressive positioning - prefer top if there's any doubt
      if (spaceBelow < dropdownHeight + 20 || spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }

      setOpenDropdowns((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(message.id)) {
          newSet.delete(message.id);
        } else {
          newSet.add(message.id);
        }
        return newSet;
      });
    };

    const handleOpen = () => {
      if (message.file_url) {
        if (message.message_type === "image") {
          // Use image viewer for images
          setImageViewer({
            isOpen: true,
            imageUrl: message.file_url,
            imageName: message.file_name || "Image",
            imageSize: message.file_size
              ? formatFileSize(parseInt(message.file_size))
              : undefined,
          });
        } else {
          // Open in new tab for other file types
          window.open(message.file_url, "_blank");
        }
      }
      setOpenDropdowns((prev) => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    };

    const handleDownload = async () => {
      if (message.file_url && !isDownloading) {
        setIsDownloading(true);
        setDownloadProgress(0);
        try {
          const fileSize = message.file_size ? parseInt(message.file_size) : 0;

          const downloadUrl = message.file_url.replace(
            "/storage/",
            "/api/download/"
          );

          try {
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = message.file_name || "download";
            link.style.display = "none";
            link.setAttribute("download", message.file_name || "download");
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (directError) {
            console.warn(
              "Direct download failed, trying enhanced methods:",
              directError
            );

            if (message.message_type === "image") {
              await downloadImageToLocal(
                message.file_url,
                message.file_name || "image"
              );
            } else {
              await downloadFileToLocal(message);
            }
          }
        } catch (error) {
          toast({
            title: "Erro",
            description: "Falha ao baixar arquivo",
            variant: "destructive",
          });

          try {
            const downloadUrl = message.file_url.replace(
              "/storage/",
              "/api/download/"
            );
            window.open(downloadUrl, "_blank", "noopener,noreferrer");
          } catch (fallbackError) {
            toast({
              title: "Erro",
              description: "Método alternativo também falhou",
              variant: "destructive",
            });
          }
        } finally {
          setIsDownloading(false);
          setDownloadProgress(0);
        }
      }
      setOpenDropdowns((prev) => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    };

    // Enhanced file download function with multiple fallback methods
    const downloadFileToLocal = async (message: Message): Promise<void> => {
      const fileName = message.file_name || "download";
      const fileSize = message.file_size ? parseInt(message.file_size) : 0;

      // Convert storage URL to API download URL
      const downloadUrl = message.file_url.replace(
        "/storage/",
        "/api/download/"
      );

      // Method 1: Try fetch with proper headers for better compatibility
      try {
        const response = await fetch(downloadUrl, {
          method: "GET",
          mode: "cors",
          credentials: "same-origin",
          headers: {
            Accept: "*/*",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        // Validate blob size if we have file size info
        if (fileSize > 0 && blob.size !== fileSize) {
          console.warn(
            `File size mismatch: expected ${fileSize}, got ${blob.size}`
          );
        }

        // Create a blob URL with proper MIME type
        const mimeType = getMimeType(fileName);
        const blobUrl = window.URL.createObjectURL(
          new Blob([blob], { type: mimeType })
        );

        // Method 1a: Modern browser download API
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = "none";
        link.setAttribute("download", fileName);
        link.setAttribute("type", mimeType);
        link.setAttribute(
          "data-downloadurl",
          `${mimeType}:${fileName}:${blobUrl}`
        );

        // Ensure the link is properly configured for download
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);

        return;
      } catch (fetchError) {
        console.warn(
          "Fetch method failed, trying fallback methods:",
          fetchError
        );

        // Method 2: For images, try canvas method
        if (message.message_type === "image") {
          try {
            await downloadImageViaCanvas(message.file_url, fileName);
            return;
          } catch (canvasError) {
            console.warn("Canvas method failed:", canvasError);
          }
        }

        // Method 3: Direct link method with proper attributes
        try {
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = fileName;
          link.style.display = "none";
          link.setAttribute("download", fileName);
          link.setAttribute("type", getMimeType(fileName));
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");

          // Add timestamp to prevent caching issues
          const url = new URL(downloadUrl);
          url.searchParams.set("download", Date.now().toString());
          url.searchParams.set("filename", fileName);

          link.href = url.toString();

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          return;
        } catch (directError) {
          console.warn("Direct link method failed:", directError);
        }

        // Method 4: Open in new tab as last resort
        try {
          window.open(downloadUrl, "_blank", "noopener,noreferrer");
          return;
        } catch (openError) {
          console.warn("Open in new tab failed:", openError);
        }

        // If all methods fail, throw error
        throw new Error("All download methods failed");
      }
    };

    // Helper function for downloading images via canvas
    const downloadImageViaCanvas = (
      imageUrl: string,
      fileName: string
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Use utility function to get proper MIME type
            const mimeType = getMimeType(fileName);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = fileName;
                  link.style.display = "none";
                  link.setAttribute("download", fileName);
                  link.setAttribute("type", mimeType);
                  link.setAttribute(
                    "data-downloadurl",
                    `${mimeType}:${fileName}:${url}`
                  );

                  // Ensure the link is properly configured for download
                  link.target = "_blank";
                  link.rel = "noopener noreferrer";

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Clean up the blob URL after a short delay
                  setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                  }, 1000);

                  resolve();
                } else {
                  reject(new Error("Failed to create blob from canvas"));
                }
              },
              mimeType,
              0.9
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image for canvas download"));
        };

        img.src = imageUrl;
      });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setOpenDropdowns((prev) => {
            const newSet = new Set(prev);
            newSet.delete(message.id);
            return newSet;
          });
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, message.id]);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="File options"
        >
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>

        {isOpen &&
          createPortal(
            <div
              className="fixed w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[9999] backdrop-blur-sm"
              style={{
                left: dropdownRef.current
                  ? Math.max(
                      10,
                      dropdownRef.current.getBoundingClientRect().right - 224
                    )
                  : 0,
                top: dropdownRef.current
                  ? Math.max(
                      10,
                      dropdownRef.current.getBoundingClientRect().top - 180
                    )
                  : 0,
                maxHeight: "240px",
                overflow: "visible",
              }}
            >
              {/* File Info Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                    {message.message_type === "image" ? (
                      <img
                        src={message.file_url}
                        alt="Preview"
                        className="w-5 h-5 rounded object-cover"
                      />
                    ) : (
                      <File className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {message.file_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {message.formatted_file_size ||
                        (message.file_size
                          ? formatFileSize(parseInt(message.file_size))
                          : "Tamanho desconhecido")}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {message.message_type === "image"
                        ? "Image"
                        : `${getFileExtension(message.file_name || "")} file`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 space-y-1">
                <button
                  onClick={handleOpen}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:shadow-sm"
                >
                  {message.message_type === "image" ? (
                    <Maximize2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="font-medium">
                    {message.message_type === "image"
                      ? "Ver Imagem"
                      : "Abrir Arquivo"}
                  </span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className="font-medium">
                    {isDownloading
                      ? downloadProgress > 0
                        ? `Baixando ${downloadProgress}%`
                        : "Baixando..."
                      : message.message_type === "image"
                      ? "Baixar Imagem"
                      : "Baixar Arquivo"}
                  </span>
                  {isDownloading && downloadProgress > 0 && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 rounded-b-lg"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  };

  const renderMessageContent = (message: Message) => {
    if (message.message_type === "file") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{message.file_name}</span>
            <span className="text-xs text-gray-500">
              {message.formatted_file_size}
            </span>
          </div>
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Baixar arquivo
          </a>
        </div>
      );
    }

    if (message.message_type === "image") {
      return (
        <div className="space-y-2">
          <img
            src={message.file_url}
            alt={message.file_name}
            className="max-w-xs rounded-lg"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{message.file_name}</span>
            <span className="text-xs text-gray-500">
              {message.formatted_file_size}
            </span>
          </div>
        </div>
      );
    }

    if (message.message_type === "offer") {
      // Check if this is a contract termination message
      if (message.offer_data?.termination_type === 'brand_terminated') {
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Contrato Terminado
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {message.message || "Este contrato foi terminado pela marca."}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contrato:</span>
                    <span className="font-medium">{message.offer_data.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                    <span className="font-medium">{message.offer_data.formatted_budget}</span>
                  </div>
                  {message.offer_data.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Terminado em:</span>
                      <span className="font-medium">
                        {new Date(message.offer_data.cancelled_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Safety check for regular offer messages
      if (!message.offer_data?.offer_id) {
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              Dados da oferta não disponíveis
            </p>
          </div>
        );
      }

      // Convert message to ChatOffer format
      const chatOffer: ChatOffer = {
        id: message.offer_data.offer_id,
        title: message.offer_data.title || "Oferta de Projeto",
        description:
          message.offer_data.description || "Oferta enviada via chat",
        budget:
          message.offer_data.formatted_budget ||
          `R$ ${message.offer_data.budget || 0},00`,
        estimated_days: message.offer_data.estimated_days || 1,
        status: message.offer_data.status || "pending",
        expires_at: message.offer_data.expires_at || new Date().toISOString(),
        days_until_expiry: message.offer_data.days_until_expiry || 0,
        is_expiring_soon: (message.offer_data.days_until_expiry || 0) <= 1,
        created_at: message.created_at,
        sender: {
          id: message.offer_data.sender?.id || 0,
          name: message.offer_data.sender?.name || "Usuário",
          avatar_url: message.offer_data.sender?.avatar_url || null,
        },
        can_be_accepted:
          message.offer_data.status === "pending" && user?.role === "creator",
        can_be_rejected:
          message.offer_data.status === "pending" && user?.role === "creator",
        can_be_cancelled:
          message.offer_data.status === "pending" && user?.role === "brand",
        contract_id: message.offer_data.contract_id,
        contract_status: message.offer_data.contract_status,
        can_be_completed: message.offer_data.can_be_completed,
      };

      return (
        <ChatOfferMessage
          offer={chatOffer}
          isSender={message.is_sender}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          onCancel={handleCancelOffer}
          onEndContract={handleEndContract}
          onTerminateContract={undefined} // Not implemented in general Chat component
          isCreator={user?.role === "creator"}
        />
      );
    }

    // Handle contract completion messages
    if (message.message_type === "contract_completion") {
      return (
        <ContractCompletionMessage
          message={message}
          onReview={async () => {
            try {
              if (selectedRoom) {
                const response = await hiringApi.getContractsForChatRoom(selectedRoom.room_id);
                const freshContracts = response.data;

                const contractToReview = freshContracts.find((c: any) => 
                  c.status === "completed" && 
                  !c.has_creator_review // Creator hasn't reviewed yet
                );
                
                if (contractToReview) {
                  setContractToReview(contractToReview);
                  setShowReviewModal(true);
                } else {
                  const fallbackContract = freshContracts.find((c: any) => 
                    c.status === "completed" && !c.has_creator_review
                  );
                  
                  if (fallbackContract) {
                    setContractToReview(fallbackContract);
                    setShowReviewModal(true);
                  } else {
                    toast({
                      title: "Erro",
                      description: "Nenhum contrato disponível para avaliação",
                      variant: "destructive",
                    });
                  }
                }
              }
            } catch (error) {
              toast({
                title: "Erro",
                description: "Erro ao carregar contratos",
                variant: "destructive",
              });
            }
          }}
          isCreator={user?.role === "creator"}
          contractData={message.offer_data}
        />
      );
    }

        // Handle system messages (like contract completion messages)
    if (message.message_type === "system") {
      // Check if this is a contract completion message
      const isContractCompletionMessage = message.message?.includes("O contrato foi finalizado com sucesso") ||
                                        message.message?.includes("O criador pode avaliar a marca") ||
                                        message.message?.includes("Contrato finalizado com sucesso") ||
                                        message.message?.includes("finalizado com sucesso") ||
                                        message.message?.includes("aguardando avaliação");
      
      // Check if user can review completed contracts
      const canReviewContract = contracts.some(
        (contract) =>
          contract.status === "completed" && 
          !contract.has_creator_review // Creator hasn't reviewed yet
      );

      // Handle contract completion messages with prominent review button for creators
      if (isContractCompletionMessage && canReviewContract) {
        return (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">🎉</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-green-900 dark:text-green-100 leading-relaxed mb-4">
                  {message.message}
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      // Find contract with waiting_review status
                      let contractToReview = contracts.find(
                        (c) =>
                          c.status === "completed" &&
                          !c.has_creator_review
                      );

                      if (contractToReview) {
                        // Check if user can review this contract
                        if (contractToReview.has_creator_review) {
                          toast({
                            title: "Avaliação já realizada",
                            description: "Você já avaliou este contrato",
                            variant: "destructive",
                          });
                          return;
                        }

                        setContractToReview(contractToReview);
                        setShowReviewModal(true);
                      } else {
                        toast({
                          title: "Erro",
                          description:
                            "Nenhum contrato encontrado para avaliação",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    ⭐ Avaliar Trabalho
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Check if this is a contract completion message and user can review (fallback for general system messages)
      const isContractRelatedMessage = message.message?.includes("finalizado") || 
                                      message.message?.includes("completed") ||
                                      message.message?.includes("aguardando avaliação");
      
      const canReview = isContractRelatedMessage && user?.role === "creator" && contracts.some(
        (contract) =>
          contract.status === "completed" && !contract.has_creator_review
      );

      // Format the message with better typography
      const formatSystemMessage = (text: string) => {
        return text
          .split('\n')
          .map((line, index) => {
            if (line.trim() === '') return <br key={index} />;
            
            // Handle bold text
            if (line.includes('**')) {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={index} className="mb-3">
                  {parts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      // Check if this is a section header (contains emojis like 📋 or ⚠️)
                      if (part.includes('📋') || part.includes('⚠️') || part.includes('💼')) {
                        return (
                          <div key={partIndex} className="text-lg font-bold text-blue-800 dark:text-blue-200 bg-white/60 dark:bg-slate-800/40 px-3 py-2 rounded-lg border-l-4 border-blue-400">
                            {part.slice(2, -2)}
                          </div>
                        );
                      }
                      return (
                        <span key={partIndex} className="font-bold text-blue-800 dark:text-blue-200">
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return <span key={partIndex}>{part}</span>;
                  })}
                </div>
              );
            }
            
            // Handle bullet points
            if (line.trim().startsWith('•')) {
              return (
                <div key={index} className="flex items-start gap-3 mb-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1 text-lg font-bold">•</span>
                  <span className="flex-1">{line.trim().substring(1).trim()}</span>
                </div>
              );
            }
            
            // Handle checkmarks and other symbols
            if (line.includes('✅') || line.includes('❌') || line.includes('⚠️') || line.includes('🚫')) {
              return (
                <div key={index} className="flex items-start gap-3 mb-3 p-2 bg-white/50 dark:bg-slate-800/30 rounded-lg">
                  <span className="text-xl flex-shrink-0">{line.match(/[✅❌⚠️🚫]/)?.[0]}</span>
                  <span className="flex-1">{line.replace(/[✅❌⚠️🚫]/, '').trim()}</span>
                </div>
              );
            }
            
            return <div key={index} className="mb-2">{line}</div>;
          });
      };

      return (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <span className="text-white text-lg">ℹ️</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed space-y-2">
                {formatSystemMessage(message.message)}
              </div>

              {/* Review button for completed contracts */}
              {canReview && (
                <div className="mt-3 flex justify-center">
                  <Button
                    onClick={() => {
                      const contractToReview = contracts.find(
                        (contract) =>
                          contract.status === "completed" &&
                          !contract.has_creator_review
                      );
                      if (contractToReview) {
                        // Check if user can review this contract
                        if (contractToReview.can_review === false) {
                          toast({
                            title: "Avaliação já realizada",
                            description: "Você já avaliou este contrato",
                            variant: "destructive",
                          });
                          return;
                        }

                        setContractToReview(contractToReview);
                        setShowReviewModal(true);
                      } else {
                        toast({
                          title: "Erro",
                          description:
                            "Nenhum contrato encontrado para avaliação",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Avaliar Agora
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <p className={`text-sm ${message.is_sender ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
        {message.message}
      </p>
    );
  };

  // Find active contract for timeline
  const activeContract = contracts.find(contract => 
    contract.status === 'active' || contract.status === 'completed'
  );

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Ontem " + format(date, "HH:mm");
    } else {
      return format(date, "dd/MM HH:mm");
    }
  };

  // Handle offer actions from chat
  const handleAcceptOffer = async (offerId: number) => {
    // Additional validation
    if (!offerId || offerId <= 0 || isNaN(offerId)) {
      console.error('Invalid offerId in handleAcceptOffer:', offerId);
      toast({
        title: "Erro",
        description: "ID da oferta inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await hiringApi.acceptOffer(offerId);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Oferta aceita com sucesso! Contrato criado.",
        });

        // Send acceptance confirmation message via socket
        if (selectedRoom && response.data?.offer && response.data?.contract && user) {
          
          // Ensure we're in the room before sending the message
          if (isConnected) {
            // Add a small delay to ensure everything is ready
            setTimeout(() => {
              sendOfferAcceptanceMessage(
                selectedRoom.room_id,
                response.data.offer,
                response.data.contract,
                user.id,
                user.name,
                user.avatar_url
              );
            }, 100);
          }
        }

        // Refresh contracts
        if (selectedRoom) {
          loadContracts(selectedRoom.room_id);
        }
      } else {
        throw new Error(response.message || "Erro ao aceitar oferta");
      }
    } catch (error: any) {
      console.error('Error in handleAcceptOffer:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao aceitar oferta",
        variant: "destructive",
      });
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    // Additional validation
    if (!offerId || offerId <= 0 || isNaN(offerId)) {
      console.error('Invalid offerId in handleRejectOffer:', offerId);
      toast({
        title: "Erro",
        description: "ID da oferta inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await hiringApi.rejectOffer(offerId);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Oferta rejeitada com sucesso",
        });
        // Refresh contracts
        if (selectedRoom) {
          loadContracts(selectedRoom.room_id);
        }
      } else {
        throw new Error(response.message || "Erro ao rejeitar oferta");
      }
    } catch (error: any) {
      console.error('Error in handleRejectOffer:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao rejeitar oferta",
        variant: "destructive",
      });
    }
  };

  const handleCancelOffer = async (offerId: number) => {
    // Additional validation
    if (!offerId || offerId <= 0 || isNaN(offerId)) {
      console.error('Invalid offerId in handleCancelOffer:', offerId);
      toast({
        title: "Erro",
        description: "ID da oferta inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await hiringApi.cancelOffer(offerId);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Oferta cancelada com sucesso",
        });
        // Refresh contracts
        if (selectedRoom) {
          loadContracts(selectedRoom.room_id);
        }
      } else {
        throw new Error(response.message || "Erro ao cancelar oferta");
      }
    } catch (error: any) {
      console.error('Error in handleCancelOffer:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao cancelar oferta",
        variant: "destructive",
      });
    }
  };

  // Handle contract completion - show confirmation modal first
  const handleEndContract = (contractId: number) => {
    const contractToEnd = contracts.find((c) => c.id === contractId);
    if (contractToEnd) {
      setContractToFinalize(contractToEnd);
      setShowCampaignFinalizationModal(true);
    }
  };

  // Handle campaign finalization after confirmation
  const handleCampaignFinalized = () => {
    // Reload messages and contracts to show updated status
    if (selectedRoom) {
      loadMessages(selectedRoom);
      loadContracts(selectedRoom.room_id);
    }
  };

  const handleReviewSubmitted = () => {
    // Reload contracts to show updated review status
    if (selectedRoom) {
      loadContracts(selectedRoom.room_id);
    }
  };

  const handleReviewModalClose = () => {
    setShowReviewModal(false);
    setContractToReview(null);
  };

  const handleBrandReviewSubmitted = () => {
    // Reload contracts to show updated review status
    if (selectedRoom) {
      loadContracts(selectedRoom.room_id);
    }
  };

  // Utility function to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Utility function to get file extension from filename
  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  // Utility function to get appropriate MIME type based on file extension
  const getMimeType = (filename: string): string => {
    const extension = getFileExtension(filename);
    const mimeTypes: { [key: string]: string } = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      ico: "image/x-icon",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      rtf: "application/rtf",
      csv: "text/csv",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",

      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      aac: "audio/aac",
      flac: "audio/flac",

      // Video
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      webm: "video/webm",
      mkv: "video/x-matroska",

      // Code
      js: "application/javascript",
      ts: "application/typescript",
      json: "application/json",
      xml: "application/xml",
      html: "text/html",
      css: "text/css",
      php: "application/x-httpd-php",
      py: "text/x-python",
      java: "text/x-java-source",
      cpp: "text/x-c++src",
      c: "text/x-csrc",

      // Other
      exe: "application/x-msdownload",
      msi: "application/x-msdownload",
      apk: "application/vnd.android.package-archive",
      dmg: "application/x-apple-diskimage",
    };

    return mimeTypes[extension] || "application/octet-stream";
  };

  const filteredRooms = chatRooms.filter(
    (room) =>
      room.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.campaign_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-background">
      <style>{`
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          data-sidebar
          className={cn(
            "flex flex-col w-full max-w-sm border-r bg-background transition-all duration-500 ease-out",
            "md:relative md:translate-x-0 md:shadow-none",
            sidebarOpen
              ? "fixed inset-0 z-50 translate-x-0 shadow-2xl border-r border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm scale-100 opacity-100"
              : "fixed inset-0 z-50 -translate-x-full md:relative md:translate-x-0 scale-95 opacity-0 md:scale-100 md:opacity-100"
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between gap-2 px-6 py-5 border-b bg-background">
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Conversas
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {chatRooms.length} conversas
                </span>
                {connectionError && (
                  <div className="flex items-center gap-1 text-red-500">
                    <WifiOff className="w-3 h-3" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
            </div>
            {connectionError && (
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                className="p-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <button
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:scale-105 hover:shadow-lg"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close conversations"
            >
              <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 pb-3 bg-background">
            <div className="relative">
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-pink-300 dark:focus:border-pink-600 transition-all duration-200"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1 bg-background">
            <div className="p-2 w-[383px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleConversationSelect(room)}
                    className={cn(
                      "w-[350px] ml-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2",
                      selectedRoom?.id === room.id
                        ? "bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={room.other_user.avatar} />
                      <AvatarFallback className="bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400">
                        {room.other_user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {room.other_user.name}
                        </h3>
                        {room.last_message_at && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatMessageTime(room.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {room.campaign_title}
                      </p>
                      {room.last_message && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {room.last_message.is_sender ? "Você: " : ""}
                          {room.last_message.message}
                        </p>
                      )}
                    </div>
                    {room.unread_count > 0 && (
                      <Badge className="ml-auto bg-pink-500 text-white text-xs">
                        {room.unread_count}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedRoom.other_user.avatar} />
                    <AvatarFallback className="bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400">
                      {selectedRoom.other_user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      {selectedRoom.other_user.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedRoom.campaign_title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile Hamburger Button */}
                  <button
                    data-hamburger
                    className={cn(
                      "md:hidden p-2 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-105",
                      !sidebarOpen && "animate-pulse"
                    )}
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open conversations"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>

                  {/* Timeline Button */}
                  {activeContract && (
                    <Button
                      onClick={() => setShowTimelineSidebar(true)}
                      variant="outline"
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 hover:text-blue-800"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Linha do Tempo
                    </Button>
                  )}

                  {/* Review Button for Creators */}
                  {user?.role === "creator" && contracts.some(contract => 
                    contract.status === "completed" && !contract.has_creator_review
                  ) && (
                    <Button
                      onClick={() => {
                        const contractToReview = contracts.find(contract => 
                          contract.status === "completed" && !contract.has_creator_review
                        );
                        if (contractToReview) {
                          setContractToReview(contractToReview);
                          setShowReviewModal(true);
                        } else {
                          toast({
                            title: "Erro",
                            description: "Nenhum contrato disponível para avaliação",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Avaliar Marca
                    </Button>
                  )}

                  {/* Review Button for Brands */}
                  {user?.role === "brand" && contracts.some(contract => 
                    contract.status === "completed" && !contract.has_brand_review
                  ) && (
                    <Button
                      onClick={() => {
                        const contractToReview = contracts.find(contract => 
                          contract.status === "completed" && !contract.has_brand_review
                        );
                        if (contractToReview) {
                          setBrandContractToReview(contractToReview);
                          setShowBrandReviewModal(true);
                        } else {
                          toast({
                            title: "Erro",
                            description: "Nenhum contrato disponível para avaliação",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Avaliar Criador
                    </Button>
                  )}

                  {isConnected ? (
                    <div className="flex items-center gap-1 text-green-500">
                      <Wifi className="w-4 h-4" />
                      <span className="text-xs">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <WifiOff className="w-4 h-4" />
                      <span className="text-xs">Offline</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    // Debug logging for duplicate detection
                    if (messages.filter(m => m.id === message.id).length > 1) {
                      console.warn('Rendering duplicate message ID:', message.id, 'at index:', index);
                    }
                    return (
                    <div
                      key={`msg-${message.id}-${index}`}
                      className={cn(
                        "flex gap-3",
                        message.message_type === "system"
                          ? "justify-center"
                          : message.is_sender
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      {!message.is_sender &&
                        message.message_type !== "system" && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={selectedRoom.other_user.avatar} />
                            <AvatarFallback className="bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 text-xs">
                              {selectedRoom.other_user.name
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      <div
                        className={cn(
                          message.message_type === "system"
                            ? "max-w-2xl px-4 py-2"
                            : "max-w-sm lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-2xl",
                          message.message_type === "system"
                            ? ""
                            : message.is_sender
                            ? "bg-pink-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        )}
                      >
                        {renderMessageContent(message)}
                        {message.message_type !== "system" && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {message.is_sender && (
                              <div className="flex items-center gap-1">
                                {message.is_read ? (
                                  <div className="flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                    <Check className="w-3 h-3 -ml-1" />
                                  </div>
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form
                className="flex items-end gap-3 px-4 py-4 border-t bg-background"
                onSubmit={handleSendMessage}
              >
                {/* File attachment button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-slate-500" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />

                {/* File preview */}
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-800 shadow-sm">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-pink-200 dark:border-pink-700"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center border border-pink-200 dark:border-pink-700">
                        <File className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="p-1.5 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    className="w-full bg-background border-slate-200 dark:border-slate-700 focus:border-pink-300 dark:focus:border-pink-600 transition-all duration-200 resize-none rounded-2xl px-4 py-3"
                    placeholder="Digite uma mensagem..."
                    value={input}
                    onChange={handleInputChange}
                    autoComplete="off"
                    aria-label="Digite uma mensagem"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    onKeyUp={handleKeyUp}
                    onBlur={handleInputBlur}
                  />

                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <div className="absolute -top-8 left-0 right-0 flex items-center gap-2 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div
                            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {Array.from(typingUsers).length === 1
                            ? `${Array.from(typingUsers)[0]} está digitando...`
                            : `${Array.from(typingUsers).join(
                                ", "
                              )} estão digitando...`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={(!input.trim() && !selectedFile) || !selectedRoom}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 h-10 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <Send />
                  <span className="hidden md:inline font-medium">Enviar</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <div className="text-6xl mb-6">💬</div>
                <p className="text-lg font-medium mb-2">
                  Selecione uma conversa
                </p>
                <p className="text-sm">
                  Escolha uma conversa da barra lateral para começar a conversar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Image Viewer */}
      <ImageViewer />

      {/* Review Modal */}
      {showReviewModal && contractToReview && (
        <div className="w-full h-screen flex justify-center items-center bg-black/60 backdrop-blur-sm">
          <ReviewModal
            isOpen={showReviewModal}
            onClose={handleReviewModalClose}
            contract={contractToReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Campaign Finalization Modal */}
      {showCampaignFinalizationModal && contractToFinalize && (
        <CampaignFinalizationModal
          isOpen={showCampaignFinalizationModal}
          onClose={() => {
            setShowCampaignFinalizationModal(false);
            setContractToFinalize(null);
          }}
          contract={contractToFinalize}
          onCampaignFinalized={handleCampaignFinalized}
        />
      )}

      {/* Campaign Timeline Sidebar */}
      {showTimelineSidebar && activeContract && (
        <CampaignTimelineSidebar
          contractId={activeContract.id}
          isOpen={showTimelineSidebar}
          onClose={() => setShowTimelineSidebar(false)}
        />
      )}

      {/* Brand Review Modal */}
      {showBrandReviewModal && brandContractToReview && (
        <BrandReviewModal
          isOpen={showBrandReviewModal}
          onClose={() => {
            setShowBrandReviewModal(false);
            setBrandContractToReview(null);
          }}
          contract={brandContractToReview}
          onReviewSubmitted={handleBrandReviewSubmitted}
        />
      )}
    </div>
  );
}
