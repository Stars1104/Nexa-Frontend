import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
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
  ArrowLeft,
  User,
  Mail,
  Phone,
  Download,
  ExternalLink,
  MoreVertical,
  Eye,
  FileText,
  ImageIcon,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  Sparkles,
  Zap,
  Star,
  Heart,
  Share2,
  Copy,
  Play,
  Pause,
  Volume2,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Briefcase,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { chatService, ChatRoom, Message } from "../../services/chatService";
import { useAppSelector } from "../../store/hooks";
import { format, isToday, isYesterday } from "date-fns";
import CreateOffer from "../../components/brand/CreateOffer";
import { hiringApi, Offer } from "../../api/hiring";
import { useToast } from "../../hooks/use-toast";
import ChatOfferMessage, { ChatOffer } from "../../components/ChatOfferMessage";
import ReviewModal from "../../components/brand/ReviewModal";

interface ChatPageProps {
  setComponent?: (component: string) => void;
}

export default function ChatPage({ setComponent }: ChatPageProps) {
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

  // Offer-related state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [existingOfferId, setExistingOfferId] = useState<number | null>(null);
  const [showExistingOfferModal, setShowExistingOfferModal] = useState(false);

  // Contract-related state
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

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

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contractToReview, setContractToReview] = useState<any>(null);

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
    onOfferCreated,
    onOfferAccepted,
    onOfferRejected,
    onOfferCancelled,
    onContractCompleted,
    onContractTerminated,
    onContractActivated,
    reconnect,
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

  // Clear typing users when room changes
  useEffect(() => {
    setTypingUsers(new Set());
  }, [selectedRoom?.room_id]);

  // Check for selected room from localStorage
  useEffect(() => {
    if (!isMountedRef.current) return;

    const selectedRoomId = localStorage.getItem("selectedChatRoom");
    if (selectedRoomId && chatRooms.length > 0) {
      const room = chatRooms.find((r) => r.room_id === selectedRoomId);
      if (room) {
        setSelectedRoom(room);
        localStorage.removeItem("selectedChatRoom"); // Clear after use
      }
    }
  }, [chatRooms]);

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

  // Join/leave room when selection changes
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (selectedRoom) {
      joinRoom(selectedRoom.room_id);
      loadMessages(selectedRoom.room_id);
      loadContracts(selectedRoom.room_id);
      loadOffers(selectedRoom.room_id);

      return () => {
        if (isMountedRef.current) {
          leaveRoom(selectedRoom.room_id);
        }
      };
    }
  }, [selectedRoom, joinRoom, leaveRoom]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isMountedRef.current) return;

    // Listen for new messages from other users
    const handleNewMessage = (data: any) => {
      if (!isMountedRef.current) return;

      if (data.roomId === selectedRoom?.room_id) {
        // Only add message if it's from another user (not the current user)
        if (data.senderId !== user?.id) {
          const newMessage: Message = {
            id: data.messageId || Date.now(), // Use server ID if available
            message: data.message,
            message_type: data.messageType,
            sender_id: data.senderId,
            sender_name: data.senderName,
            sender_avatar: data.senderAvatar,
            is_sender: data.senderId === user?.id,
            file_path: data.fileData?.file_path,
            file_name: data.fileData?.file_name,
            file_size: data.fileData?.file_size,
            file_type: data.fileData?.file_type,
            file_url: data.fileData?.file_url,
            is_read: false,
            created_at: data.timestamp || new Date().toISOString(),
          };

          setMessages((prev) => {
            const updated = [...prev, newMessage];
            return updated;
          });

          // Mark as read if it's not from current user
          markMessagesAsRead(data.roomId, [newMessage.id]);
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

    // Listen for read receipts
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

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      try {
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleUserTyping);
        socket.off("messages_read", handleMessagesRead);
      } catch (error) {
        console.warn("Error removing socket listeners:", error);
      }
    };
  }, [socket, selectedRoom, user, markMessagesAsRead]);

  // Socket event listeners for real-time contract and offer updates
  useEffect(() => {
    if (!socket || !isMountedRef.current) return;

    // Listen for offer created events
    const handleOfferCreated = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Offer created via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Add new offer to the offers list
        setOffers((prev) => {
          const newOffer: Offer = {
            id: data.offerData.id,
            title: data.offerData.title,
            description: data.offerData.description,
            budget: data.offerData.formatted_budget,
            estimated_days: data.offerData.estimated_days,
            requirements: [],
            status: data.offerData.status as 'pending' | 'accepted' | 'rejected' | 'expired',
            expires_at: data.offerData.expires_at,
            days_until_expiry: data.offerData.days_until_expiry,
            is_expiring_soon: data.offerData.days_until_expiry <= 1,
            is_expired: data.offerData.status === 'expired',
            can_be_accepted: data.offerData.status === 'pending' && user?.role === 'creator',
            can_be_rejected: data.offerData.status === 'pending' && user?.role === 'creator',
            can_be_cancelled: data.offerData.status === 'pending' && user?.role === 'brand',
            other_user: {
              id: user?.role === 'brand' ? data.offerData.creator_id : data.offerData.brand_id,
              name: '',
              avatar_url: '',
            },
            created_at: new Date().toISOString(),
          };
          return [newOffer, ...prev];
        });

        // Reload messages to show the offer message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Listen for offer accepted events
    const handleOfferAccepted = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Offer accepted via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Update offer status
        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === data.offerData.id
              ? { ...offer, status: 'accepted' }
              : offer
          )
        );

        // Add new contract if contract data is provided
        if (data.contractData) {
          setContracts((prev) => {
            const newContract = {
              id: data.contractData.id,
              title: data.contractData.title,
              description: data.contractData.description,
              status: data.contractData.status,
              workflow_status: data.contractData.workflow_status,
              can_be_completed: data.contractData.can_be_completed,
            };
            return [newContract, ...prev];
          });
        }

        // Reload messages to show the acceptance message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Listen for offer rejected events
    const handleOfferRejected = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Offer rejected via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Update offer status
        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === data.offerData.id
              ? { ...offer, status: 'rejected' }
              : offer
          )
        );

        // Reload messages to show the rejection message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Listen for offer cancelled events
    const handleOfferCancelled = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Offer cancelled via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Update offer status
        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === data.offerData.id
              ? { ...offer, status: 'cancelled' }
              : offer
          )
        );

        // Reload messages to show the cancellation message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Listen for contract completed events
    const handleContractCompleted = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Contract completed via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Update contract with complete data from server
        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === data.contractData.id
              ? {
                ...contract,
                ...data.contractData,
                status: 'completed',
                workflow_status: 'waiting_review',
                can_review: true,
              }
              : contract
          )
        );

        // Show success toast
        toast({
          title: "Contrato Finalizado",
          description: "O contrato foi finalizado com sucesso!",
        });

        // Reload messages to show the completion message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Listen for contract terminated events
    const handleContractTerminated = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Contract terminated via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Update contract with complete data from server
        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === data.contractData.id
              ? {
                ...contract,
                ...data.contractData,
                status: 'terminated',
                workflow_status: 'terminated',
              }
              : contract
          )
        );

        // Show notification
        toast({
          title: "Contrato Terminado",
          description: data.terminationReason || "O contrato foi terminado",
        });

        // Reload messages to show the termination message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Listen for contract activated events
    const handleContractActivated = (data: any) => {
      if (!isMountedRef.current) return;
      console.log('[ChatPage] Contract activated via Socket.IO:', data);

      if (data.roomId === selectedRoom?.room_id) {
        // Update contract with complete data from server
        setContracts((prev) => {
          const existingContract = prev.find(c => c.id === data.contractData.id);
          if (existingContract) {
            return prev.map((contract) =>
              contract.id === data.contractData.id
                ? {
                  ...contract,
                  ...data.contractData,
                  status: 'active',
                  workflow_status: data.contractData.workflow_status,
                }
                : contract
            );
          } else {
            // Add new contract with complete data
            return [data.contractData, ...prev];
          }
        });

        // The accepted offer will be cleared when contracts are reloaded

        // Show success toast
        toast({
          title: "Contrato Ativado",
          description: "O contrato foi ativado com sucesso!",
        });

        // Reload messages to show the activation message
        loadMessages(selectedRoom.room_id);
      }
    };

    // Set up event listeners
    socket.on('offer_created', handleOfferCreated);
    socket.on('offer_accepted', handleOfferAccepted);
    socket.on('offer_rejected', handleOfferRejected);
    socket.on('offer_cancelled', handleOfferCancelled);
    socket.on('contract_completed', handleContractCompleted);
    socket.on('contract_terminated', handleContractTerminated);
    socket.on('contract_activated', handleContractActivated);

    return () => {
      // Cleanup event listeners
      socket.off('offer_created', handleOfferCreated);
      socket.off('offer_accepted', handleOfferAccepted);
      socket.off('offer_rejected', handleOfferRejected);
      socket.off('offer_cancelled', handleOfferCancelled);
      socket.off('contract_completed', handleContractCompleted);
      socket.off('contract_terminated', handleContractTerminated);
      socket.off('contract_activated', handleContractActivated);
    };
  }, [socket, selectedRoom, user, onOfferCreated, onOfferAccepted, onOfferRejected, onOfferCancelled, onContractCompleted, onContractTerminated, onContractActivated]);

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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && imageViewer.isOpen) {
        setImageViewer({
          isOpen: false,
          imageUrl: "",
          imageName: "",
          imageSize: "",
        });
        setImageZoom(1);
        setImageRotation(0);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!imageViewer.isOpen) return;

      switch (event.key) {
        case "Escape":
          setImageViewer({
            isOpen: false,
            imageUrl: "",
            imageName: "",
            imageSize: "",
          });
          setImageZoom(1);
          setImageRotation(0);
          break;
        case "+":
        case "=":
          event.preventDefault();
          setImageZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case "-":
          event.preventDefault();
          setImageZoom((prev) => Math.max(prev - 0.25, 0.25));
          break;
        case "r":
          event.preventDefault();
          setImageRotation((prev) => (prev + 90) % 360);
          break;
        case "0":
          event.preventDefault();
          setImageZoom(1);
          setImageRotation(0);
          break;
        case "d":
          event.preventDefault();
          downloadImageToLocal(imageViewer.imageUrl, imageViewer.imageName);
          break;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleKeyDown);

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
  }, [selectedRoom, isCurrentUserTyping, stopTyping, imageViewer.isOpen]);

  const loadChatRooms = async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      const rooms = await chatService.getChatRooms();
      if (isMountedRef.current) {
        setChatRooms(rooms);
        if (rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(rooms[0]);
        }
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
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

    setSelectedRoom(room);

    // Load messages for the selected room
    await loadMessages(room.room_id);

    // Load contracts for the selected room
    await loadContracts(room.room_id);

    // Load offers for the selected room
    await loadOffers(room.room_id);

    // Focus input
    setTimeout(() => {
      if (inputRef.current && isMountedRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const loadMessages = async (roomId: string) => {
    if (!isMountedRef.current) return;

    try {
      console.log('[ChatPage] Loading messages for room:', roomId);
      const response = await chatService.getMessages(roomId);
      console.log('[ChatPage] Messages loaded:', response.messages.length, 'messages');

      if (isMountedRef.current) {
        // Only deduplicate if there are actual duplicates (same message ID)
        const messageIds = new Set();
        const deduplicatedMessages = response.messages.filter((message) => {
          if (messageIds.has(message.id)) {
            return false; // Skip duplicate message IDs
          }
          messageIds.add(message.id);
          return true;
        });

        // Log offer messages for debugging
        const offerMessages = deduplicatedMessages.filter(msg => msg.message_type === 'offer');
        console.log('[ChatPage] Offer messages found:', offerMessages.length);
        offerMessages.forEach(msg => {
          console.log('[ChatPage] Offer message:', {
            id: msg.id,
            offer_id: msg.offer_data?.offer_id,
            status: msg.offer_data?.status,
            can_be_accepted: msg.offer_data?.status === "pending"
          });
        });

        setMessages(deduplicatedMessages);
      }
    } catch (error) {
      console.error("[ChatPage] Error loading messages:", error);
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
              console.error(
                `Error fetching review status for contract ${contract.id}:`,
                error
              );
              return contract;
            }
          })
        );

        setContracts(contractsWithReviewStatus);
      }
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingContracts(false);
      }
    }
  };

  // Load offers for the selected room
  const loadOffers = async (roomId: string) => {
    if (!isMountedRef.current) return;

    try {
      setIsLoadingOffers(true);
      const response = await hiringApi.getOffersForChatRoom(roomId);
      if (isMountedRef.current) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingOffers(false);
      }
    }
  };

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
          const updated = [...prev, newMessage];
          return updated;
        });
        setInput("");

        // Stop typing indicator immediately when message is sent
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setIsCurrentUserTyping(false);
        stopTyping(selectedRoom.room_id);
      }
    } catch (error) {
      console.error("[ChatPage] Error sending message:", error);
    }
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMountedRef.current) return;

    const file = e.target.files?.[0];
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

  const handleBackNavigation = () => {
    // Ensure all cleanup is done before navigation
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Clear any file selections
    setSelectedFile(null);
    setFilePreview(null);

    // Navigate back
    setComponent?.("Minhas campanhas");
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
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };

    return mimeTypes[extension] || "application/octet-stream";
  };

  const filteredRooms = chatRooms.filter(
    (room) =>
      room.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.campaign_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  // Check if there's an active contract for this chat room
  const activeContract = contracts.find(
    (contract) => contract.status === "active"
  );

  // Check if there's an accepted offer waiting for contract activation
  const acceptedOffer = offers.find((offer) => offer.status === "accepted");

  // Check if current user can end contract (brand only)
  const canEndContract =
    user?.role === "brand" && selectedRoom && (activeContract || acceptedOffer);

  // Check if current user can terminate contract (brand only)
  const canTerminateContract =
    user?.role === "brand" && selectedRoom && (activeContract || acceptedOffer);

  // Check if current user can activate contract (brand only) - CACHE BUST
  const canActivateContract =
    user?.role === "brand" && selectedRoom && acceptedOffer && !activeContract;

  // Check if current user can send offer (brand only)
  const canSendOffer =
    user?.role === "brand" &&
    selectedRoom &&
    !activeContract &&
    !contracts.some(
      (contract) =>
        contract.status === "active" || contract.status === "completed"
    ) &&
    !offers.some((offer) => offer.status === "accepted"); // Only prevent if there's an accepted offer

  // Check if current user can review (brand only)
  const canReview = contracts.some(
    (contract) =>
      contract.status === "completed" && contract.can_review === true
  );

  // Handle offer creation
  const handleOfferCreated = () => {
    setShowOfferModal(false);
    loadChatRooms();
  };

  // Handle offer cancellation
  const handleOfferCancel = () => {
    setShowOfferModal(false);
  };

  // Handle existing offer
  const handleExistingOffer = (offerId: number) => {
    setExistingOfferId(offerId);
    setShowExistingOfferModal(true);
    setShowOfferModal(false);
  };

  // Handle cancel existing offer
  const handleCancelExistingOffer = async () => {
    if (!existingOfferId) return;

    try {
      await hiringApi.cancelOffer(existingOfferId);
      setShowExistingOfferModal(false);
      setExistingOfferId(null);

      toast({
        title: "Sucesso",
        description: "Oferta existente cancelada com sucesso!",
      });

      setShowOfferModal(true); // Reopen the offer modal
    } catch (error: any) {
      console.error("Error cancelling existing offer:", error);

      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao cancelar oferta existente",
        variant: "destructive",
      });
    }
  };

  // Handle offer actions from chat
  const handleAcceptOffer = async (offerId: number) => {
    try {
      toast({
        title: "Processando...",
        description: "Aceitando oferta...",
      });

      await hiringApi.acceptOffer(offerId);

      toast({
        title: "Sucesso",
        description: "Oferta aceita com sucesso!",
      });

      // Socket.IO will handle real-time updates automatically
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao aceitar oferta",
        variant: "destructive",
      });

      // Reload data on error to show current status
      if (selectedRoom) {
        loadMessages(selectedRoom.room_id);
        loadOffers(selectedRoom.room_id);
        loadContracts(selectedRoom.room_id);
      }
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      toast({
        title: "Processando...",
        description: "Rejeitando oferta...",
      });

      await hiringApi.rejectOffer(offerId);

      toast({
        title: "Sucesso",
        description: "Oferta rejeitada com sucesso!",
      });

      // Socket.IO will handle real-time updates automatically
    } catch (error: any) {
      console.error("Error rejecting offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao rejeitar oferta",
        variant: "destructive",
      });

      // Reload data on error to show current status
      if (selectedRoom) {
        loadMessages(selectedRoom.room_id);
        loadOffers(selectedRoom.room_id);
        loadContracts(selectedRoom.room_id);
      }
    }
  };

  const handleCancelOffer = async (offerId: number) => {
    try {
      await hiringApi.cancelOffer(offerId);
      toast({
        title: "Sucesso",
        description: "Oferta cancelada com sucesso!",
      });
      // Socket.IO will handle real-time updates automatically
    } catch (error: any) {
      console.error("Error cancelling offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao cancelar oferta",
        variant: "destructive",
      });
    }
  };

  // Handle contract completion
  const handleEndContract = async (contractId: number) => {
    try {
      await hiringApi.completeContract(contractId);

      toast({
        title: "Sucesso",
        description: "Contrato finalizado com sucesso!",
      });

      // Socket.IO will handle real-time updates automatically
      // Find the completed contract and show review modal
      const completedContract = contracts.find((c) => c.id === contractId);
      if (completedContract) {
        setContractToReview(completedContract);
        setShowReviewModal(true);
      }
    } catch (error: any) {
      console.error("Error completing contract:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao finalizar contrato",
        variant: "destructive",
      });
    }
  };

  // Handle activating contract from accepted offer
  const handleActivateContract = async () => {
    if (!acceptedOffer) return;

    try {
      // Find the pending contract for this accepted offer
      const pendingContract = contracts.find(contract =>
        contract.status === 'pending' &&
        contract.offer_id === acceptedOffer.id
      );

      if (!pendingContract) {
        toast({
          title: "Erro",
          description: "Contrato pendente não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Call the API to activate the contract
      const response = await hiringApi.activateContract(pendingContract.id);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Contrato ativado com sucesso!",
        });

        // Update local state immediately
        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === pendingContract.id
              ? {
                ...contract,
                status: 'active',
                workflow_status: 'active',
                can_be_completed: true,
              }
              : contract
          )
        );
      } else {
        throw new Error(response.message || "Erro ao ativar contrato");
      }
    } catch (error: any) {
      console.error("Error activating contract:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao ativar contrato",
        variant: "destructive",
      });
    }
  };

  const handleTerminateContract = async (contractId: number) => {
    try {
      const response = await hiringApi.terminateContract(contractId);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Contrato terminado com sucesso!",
        });

        // Update local state immediately
        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === contractId
              ? {
                ...contract,
                status: 'terminated',
                workflow_status: 'terminated',
              }
              : contract
          )
        );
      } else {
        throw new Error(response.message || "Erro ao terminar contrato");
      }
    } catch (error: any) {
      console.error("Error terminating contract:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao terminar contrato",
        variant: "destructive",
      });
    }
  };

  // Review modal handlers
  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setContractToReview(null);

    // Update contract status to show review was submitted
    if (contractToReview) {
      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === contractToReview.id
            ? {
              ...contract,
              workflow_status: 'payment_available',
              review: {
                id: Date.now(), // Temporary ID
                rating: 5,
                comment: "Review submitted",
                created_at: new Date().toISOString(),
              },
            }
            : contract
        )
      );
    }
  };

  const handleReviewModalClose = () => {
    setShowReviewModal(false);
    setContractToReview(null);
  };

  // Utility function to create a robust download link
  const createDownloadLink = (
    url: string,
    fileName: string,
    mimeType: string
  ): HTMLAnchorElement => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    link.setAttribute("download", fileName);
    link.setAttribute("type", mimeType);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    // Add additional attributes for better browser compatibility
    link.setAttribute("data-downloadurl", `${mimeType}:${fileName}:${url}`);
    return link;
  };

  // Utility function to trigger download with proper cleanup
  const triggerDownload = (link: HTMLAnchorElement, blobUrl?: string): void => {
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL if provided
    if (blobUrl) {
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    }
  };

  // Enhanced image download function that FORCES download to local folder (CORS bypass)
  const downloadImageToLocal = async (
    imageUrl: string,
    fileName: string
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert storage URL to API download URL to bypass CORS
        const downloadUrl = imageUrl.replace("/storage/", "/api/download/");

        // Method 1: Try to create a download link with proper attributes (most reliable)
        try {
          // Create a temporary anchor element
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = fileName;
          link.style.display = "none";
          link.setAttribute("download", fileName);
          link.setAttribute("type", getMimeType(fileName));
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");

          // Add timestamp to prevent caching
          const url = new URL(downloadUrl);
          url.searchParams.set("download", Date.now().toString());
          url.searchParams.set("filename", fileName);
          url.searchParams.set("disposition", "attachment");
          link.href = url.toString();

          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          resolve();
          return;
        } catch (directError) {
          console.warn(
            "Direct link failed, trying fetch with proxy:",
            directError
          );
        }

        // Method 2: Try fetch with proxy endpoint
        try {
          const response = await fetch(downloadUrl, {
            method: "GET",
            mode: "cors",
            credentials: "include",
            headers: {
              Accept: "image/*,*/*;q=0.8",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);

          // Create download link
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = "none";
          link.setAttribute("download", fileName);
          link.setAttribute("type", getMimeType(fileName));

          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up blob URL
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);

          resolve();
          return;
        } catch (fetchError) {
          console.warn(
            "Proxy fetch failed, trying XMLHttpRequest:",
            fetchError
          );
        }

        // Method 3: Try XMLHttpRequest with proxy endpoint
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", downloadUrl, true);
          xhr.responseType = "blob";
          xhr.withCredentials = true;

          xhr.onload = function () {
            if (xhr.status === 200) {
              const blob = xhr.response;
              const blobUrl = window.URL.createObjectURL(blob);

              // Create download link
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = fileName;
              link.style.display = "none";
              link.setAttribute("download", fileName);
              link.setAttribute("type", getMimeType(fileName));

              // Trigger download
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Clean up blob URL
              setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
              }, 1000);

              resolve();
            } else {
              throw new Error(`XHR failed with status: ${xhr.status}`);
            }
          };

          xhr.onerror = function () {
            throw new Error("XHR request failed");
          };

          xhr.send();
          return;
        } catch (xhrError) {
          console.warn("Proxy XHR failed, using manual download:", xhrError);
        }

        // Method 4: Manual download as fallback
        console.warn(
          "All proxy methods failed, opening in new tab for manual download"
        );
        try {
          const newWindow = window.open(
            downloadUrl,
            "_blank",
            "noopener,noreferrer"
          );
          if (newWindow) {
            setTimeout(() => {
              alert(
                `Image "${fileName}" opened in new tab. Please right-click and select "Save image as..." to download it.`
              );
            }, 100);
            resolve();
          } else {
            reject(new Error("Popup blocked by browser"));
          }
        } catch (openError) {
          reject(openError);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Enhanced file download function that FORCES download to local folder (CORS bypass)
  const downloadFileToLocal = async (message: Message): Promise<void> => {
    const fileName = message.file_name || "download";
    const fileSize = message.file_size ? parseInt(message.file_size) : 0;

    // Convert storage URL to API download URL to bypass CORS
    const downloadUrl = message.file_url.replace("/storage/", "/api/download/");

    // Method 1: Force download using fetch and blob conversion (most reliable)
    try {
      const response = await fetch(downloadUrl, {
        method: "GET",
        mode: "cors",
        credentials: "include",
        headers: {
          Accept: "*/*",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
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

      // Create blob URL with proper MIME type
      const mimeType = getMimeType(fileName);
      const blobUrl = window.URL.createObjectURL(
        new Blob([blob], { type: mimeType })
      );

      // Create download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";
      link.setAttribute("download", fileName);
      link.setAttribute("type", mimeType);

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      return;
    } catch (fetchError) {
      console.warn("Proxy fetch method failed, trying XHR method:", fetchError);
    }

    // Method 2: Try XMLHttpRequest with proxy endpoint
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", downloadUrl, true);
      xhr.responseType = "blob";
      xhr.withCredentials = true;

      xhr.onload = function () {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const blobUrl = window.URL.createObjectURL(blob);

          // Create download link
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = "none";
          link.setAttribute("download", fileName);
          link.setAttribute("type", getMimeType(fileName));

          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up blob URL
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);
        } else {
          throw new Error(`XHR failed with status: ${xhr.status}`);
        }
      };

      xhr.onerror = function () {
        throw new Error("XHR request failed");
      };

      xhr.send();
      return;
    } catch (xhrError) {
      console.warn(
        "Proxy XHR method failed, trying image-specific method:",
        xhrError
      );
    }

    // Method 3: For images, try the optimized image download method
    if (message.message_type === "image") {
      try {
        await downloadImageToLocal(message.file_url, fileName);
        return;
      } catch (imageError) {
        console.warn("Image download method failed:", imageError);
      }
    }

    // Method 4: Try direct link with proxy endpoint
    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = "none";
      link.setAttribute("download", fileName);
      link.setAttribute("type", getMimeType(fileName));

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return;
    } catch (directError) {
      console.warn(
        "Proxy direct link failed, using manual download:",
        directError
      );
    }

    // Method 5: Open in new tab as absolute last resort
    try {
      const newWindow = window.open(
        downloadUrl,
        "_blank",
        "noopener,noreferrer"
      );
      if (newWindow) {
        return;
      } else {
        throw new Error("Popup blocked");
      }
    } catch (openError) {
      console.warn("Open in new tab failed:", openError);
    }

    // If all methods fail, throw error
    throw new Error(
      'All download methods failed. Please try right-clicking the file and selecting "Save as".'
    );
  };

  // File Dropdown Component - Enhanced with beautiful design
  const FileDropdown = ({ message }: { message: Message }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isOpen = openDropdowns[message.id];
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

    const toggleDropdown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setOpenDropdowns((prev) => {
        const newState = {
          ...prev,
          [message.id]: !prev[message.id],
        };
        return newState;
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
          if (message.message_type === "image") {
            // Use enhanced image download for images
            await downloadImageToLocal(
              message.file_url,
              message.file_name || "image"
            );
          } else {
            // Use regular download for other files
            await downloadFileToLocal(message);
          }
        } catch (error) {
          console.error("Error downloading file:", error);

          // Try alternative download method
          try {
            const link = createDownloadLink(
              message.file_url,
              message.file_name || "download",
              getMimeType(message.file_name || "")
            );
            triggerDownload(link);
          } catch (altError) {
            console.error("Alternative download also failed:", altError);
          }
        } finally {
          setIsDownloading(false);
          setDownloadProgress(0);
        }
      }
      setOpenDropdowns((prev) => ({
        ...prev,
        [message.id]: false,
      }));
    };

    const handleCopyLink = () => {
      if (message.file_url) {
        navigator.clipboard.writeText(message.file_url);
      }
      setOpenDropdowns((prev) => ({
        ...prev,
        [message.id]: false,
      }));
    };

    const handleShare = () => {
      if (navigator.share && message.file_url) {
        navigator.share({
          title: message.file_name,
          url: message.file_url,
        });
      } else {
        handleCopyLink();
      }
      setOpenDropdowns((prev) => ({
        ...prev,
        [message.id]: false,
      }));
    };

    // Get file icon based on type
    const getFileIcon = (fileName: string, messageType: string) => {
      const extension = getFileExtension(fileName);

      if (messageType === "image") return <ImageIcon className="w-5 h-5" />;

      switch (extension) {
        case "pdf":
          return <FileText className="w-5 h-5" />;
        case "doc":
        case "docx":
          return <FileText className="w-5 h-5" />;
        case "mp4":
        case "avi":
        case "mov":
        case "wmv":
          return <FileVideo className="w-5 h-5" />;
        case "mp3":
        case "wav":
        case "flac":
          return <FileAudio className="w-5 h-5" />;
        case "zip":
        case "rar":
        case "7z":
          return <Archive className="w-5 h-5" />;
        case "js":
        case "ts":
        case "jsx":
        case "tsx":
        case "html":
        case "css":
        case "json":
          return <Code className="w-5 h-5" />;
        default:
          return <File className="w-5 h-5" />;
      }
    };

    // Get file color based on type
    const getFileColor = (fileName: string, messageType: string) => {
      const extension = getFileExtension(fileName);

      if (messageType === "image") return "from-emerald-500 to-teal-600";

      switch (extension) {
        case "pdf":
          return "from-red-500 to-pink-600";
        case "doc":
        case "docx":
          return "from-blue-500 to-indigo-600";
        case "mp4":
        case "avi":
        case "mov":
        case "wmv":
          return "from-purple-500 to-violet-600";
        case "mp3":
        case "wav":
        case "flac":
          return "from-orange-500 to-amber-600";
        case "zip":
        case "rar":
        case "7z":
          return "from-yellow-500 to-orange-600";
        case "js":
        case "ts":
        case "jsx":
        case "tsx":
        case "html":
        case "css":
        case "json":
          return "from-indigo-500 to-purple-600";
        default:
          return "from-slate-500 to-gray-600";
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setOpenDropdowns((prev) => ({
            ...prev,
            [message.id]: false,
          }));
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
          ref={buttonRef}
          onClick={toggleDropdown}
          className={`p-2.5 rounded-xl transition-all duration-300 border-2 ${isOpen
              ? "bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-pink-300 dark:border-pink-700 shadow-lg scale-105"
              : "hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-gray-700 border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:scale-105"
            }`}
          aria-label="File options"
        >
          <MoreVertical
            className={`w-4 h-4 transition-colors duration-300 ${isOpen ? "text-pink-600 dark:text-pink-400" : "text-slate-500"
              }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[9999] backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
            {/* File Info Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${getFileColor(
                    message.file_name || "",
                    message.message_type
                  )} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  {getFileIcon(message.file_name || "", message.message_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {message.file_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {message.formatted_file_size ||
                      (message.file_size
                        ? formatFileSize(parseInt(message.file_size))
                        : "Unknown size")}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {getFileExtension(message.file_name || "")} file
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 space-y-2">
              <button
                onClick={handleOpen}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 rounded-xl transition-all duration-300 hover:shadow-md group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {message.message_type === "image" ? (
                    <Maximize2 className="w-4 h-4 text-white" />
                  ) : (
                    <Eye className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-semibold">
                  {message.message_type === "image"
                    ? "View Image"
                    : "Open File"}
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 rounded-xl transition-all duration-300 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-semibold">
                  {isDownloading
                    ? downloadProgress > 0
                      ? `Downloading ${downloadProgress}%`
                      : "Downloading..."
                    : message.message_type === "image"
                      ? "Download Image"
                      : "Download File"}
                </span>
                {isDownloading && downloadProgress > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300 rounded-b-xl"
                    style={{ width: `${downloadProgress}%` }}
                  />
                )}
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-xl transition-all duration-300 hover:shadow-md group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Share File</span>
                <Zap className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors duration-300" />
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 dark:hover:from-orange-900/20 dark:hover:to-amber-900/20 rounded-xl transition-all duration-300 hover:shadow-md group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Copy className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Copy Link</span>
                <Star className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors duration-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessageContent = (message: Message) => {
    if (message.message_type === "file") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <File className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:t truncate">
                  {message.file_name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {message.formatted_file_size ||
                    (message.file_size
                      ? formatFileSize(parseInt(message.file_size))
                      : "Unknown size")}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {getFileExtension(message.file_name || "")} file
                </div>
              </div>
            </div>
            <FileDropdown message={message} />
          </div>
          {message.message && message.message !== message.file_name && (
            <p className="text-sm text-slate-300 dark:text-slate-300">
              {message.message}
            </p>
          )}
        </div>
      );
    } else if (message.message_type === "image") {
      const handleImageClick = () => {
        setImageViewer({
          isOpen: true,
          imageUrl: message.file_url || "",
          imageName: message.file_name || "Image",
          imageSize: message.file_size
            ? formatFileSize(parseInt(message.file_size))
            : undefined,
        });
      };

      return (
        <div className="space-y-3">
          {message.file_url && (
            <div className="relative group">
              <img
                src={message.file_url}
                alt={message.file_name || "Image"}
                className="max-w-full max-h-80 rounded-xl object-cover cursor-pointer"
                onClick={handleImageClick}
              />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick();
                  }}
                  className="p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  title="View Full Size"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImageToLocal(
                      message.file_url || "",
                      message.file_name || "image"
                    );
                  }}
                  className="p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {message.message && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {message.message}
            </p>
          )}
        </div>
      );
    } else if (message.message_type === "offer" && message.offer_data) {
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
          isCreator={user?.role === "creator"}
        />
      );
    }

    // Handle system messages (like contract completion messages)
    if (message.message_type === "system") {
      const isReviewMessage =
        message.message?.includes("review") ||
        message.message?.includes("avaliação");

      return (
        <div
          className={cn(
            "border rounded-xl p-3 shadow-sm",
            isReviewMessage
              ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-600"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
          )}
        >
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                isReviewMessage ? "bg-yellow-500" : "bg-blue-500"
              )}
            >
              <span className="text-white text-xs">
                {isReviewMessage ? "⭐" : "ℹ️"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed">
                {message.message}
              </p>
              {isReviewMessage && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // Try to find contract with waiting_review status first
                      let contractToReview = contracts.find(
                        (c) =>
                          c.status === "completed" &&
                          c.workflow_status === "waiting_review"
                      );

                      // If not found, try to find any completed contract
                      if (!contractToReview) {
                        contractToReview = contracts.find(
                          (c) => c.status === "completed"
                        );
                      }

                      // If still not found, try to find any contract
                      if (!contractToReview && contracts.length > 0) {
                        contractToReview = contracts[0];
                      }

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
                        console.error("No contract found for review!");
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
      <p className="text-sm text-slate-300">
        {message.message}
      </p>
    );
  };

  // Get file icon based on type (for use in renderMessageContent)
  const getFileIcon = (fileName: string, messageType: string) => {
    const extension = getFileExtension(fileName);

    if (messageType === "image")
      return <ImageIcon className="w-6 h-6 text-white" />;

    switch (extension) {
      case "pdf":
        return <FileText className="w-6 h-6 text-white" />;
      case "doc":
      case "docx":
        return <FileText className="w-6 h-6 text-white" />;
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
        return <FileVideo className="w-6 h-6 text-white" />;
      case "mp3":
      case "wav":
      case "flac":
        return <FileAudio className="w-6 h-6 text-white" />;
      case "zip":
      case "rar":
      case "7z":
        return <Archive className="w-6 h-6 text-white" />;
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
      case "json":
        return <Code className="w-6 h-6 text-white" />;
      default:
        return <File className="w-6 h-6 text-white" />;
    }
  };

  // Get file color based on type (for use in renderMessageContent)
  const getFileColor = (fileName: string, messageType: string) => {
    const extension = getFileExtension(fileName);

    if (messageType === "image") return "from-emerald-500 to-teal-600";

    switch (extension) {
      case "pdf":
        return "from-red-500 to-pink-600";
      case "doc":
      case "docx":
        return "from-blue-500 to-indigo-600";
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
        return "from-purple-500 to-violet-600";
      case "mp3":
      case "wav":
      case "flac":
        return "from-orange-500 to-amber-600";
      case "zip":
      case "rar":
      case "7z":
        return "from-yellow-500 to-orange-600";
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
      case "json":
        return "from-indigo-500 to-purple-600";
      default:
        return "from-slate-500 to-gray-600";
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Mobile Hamburger Button */}
      <button
        data-hamburger
        className="md:hidden fixed top-4 left-16 z-50 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open conversations"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          data-sidebar
          className={cn(
            "flex flex-col w-full max-w-sm border-r bg-background transition-all duration-300 ease-in-out",
            "md:relative md:translate-x-0 md:shadow-none",
            sidebarOpen
              ? "fixed inset-0 z-40 translate-x-0 shadow-2xl"
              : "fixed inset-0 z-40 -translate-x-full md:relative md:translate-x-0"
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
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close conversations"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 pb-3">
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
          <ScrollArea className="flex-1">
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
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2",
                      selectedRoom?.id === room.id
                        ? "bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={`${import.meta.env.VITE_BACKEND_URL ||
                          "https://nexacreators.com.br"
                          }${room.other_user.avatar}`}
                      />
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
                    <AvatarImage
                      src={`${import.meta.env.VITE_BACKEND_URL ||
                        "https://nexacreators.com.br"
                        }${selectedRoom.other_user.avatar}`}
                    />
                    <AvatarFallback className="bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400">
                      {selectedRoom.other_user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      {selectedRoom.other_user.name}
                    </h2>
                    <div className="flex items-center gap-2">
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
                </div>

                <div className="flex items-center gap-2">
                  {/* Send Offer Button */}
                  {canSendOffer && (
                    <>
                      {/* Check if there's already a pending offer */}
                      {offers.some(offer => offer.status === 'pending') ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              const pendingOffer = offers.find(offer => offer.status === 'pending');
                              if (pendingOffer) {
                                handleExistingOffer(pendingOffer.id);
                              }
                            }}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Oferta Pendente
                          </Button>
                          <Button
                            onClick={() => setShowOfferModal(true)}
                            variant="outline"
                            className="border-orange-600 text-orange-600 hover:bg-orange-50"
                          >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Nova Oferta
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setShowOfferModal(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Briefcase className="w-4 h-4 mr-2" />
                          Enviar Oferta
                        </Button>
                      )}
                    </>
                  )}

                  {/* Review Button for Completed Contracts */}
                  {canReview && (
                    <Button
                      onClick={() => {
                        // Try to find contract with waiting_review status first
                        let contractToReview = contracts.find(
                          (c) =>
                            c.status === "completed" &&
                            c.workflow_status === "waiting_review"
                        );

                        // If not found, try to find any completed contract
                        if (!contractToReview) {
                          contractToReview = contracts.find(
                            (c) => c.status === "completed"
                          );
                        }

                        // If still not found, try to find any contract
                        if (!contractToReview && contracts.length > 0) {
                          contractToReview = contracts[0];
                        }

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
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Star className="w-4 h-4 mr-2" />⚡ Avaliar Trabalho
                    </Button>
                  )}

                  {/* Activate Contract Button */}
                  {canActivateContract && (
                    <Button
                      onClick={handleActivateContract}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Ativar Contrato
                    </Button>
                  )}

                  {/* End Contract Button */}
                  {canEndContract && (
                    <Button
                      onClick={() => {
                        const contractToEnd = activeContract;
                        if (contractToEnd) {
                          handleEndContract(contractToEnd.id);
                        }
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Finalizar Contrato
                    </Button>
                  )}

                  {/* Terminate Contract Button */}
                </div>
              </div>

              {/* Review Notification Banner */}
              {canReview && (
                <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-300 dark:border-yellow-600 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        ⚡ Você tem contratos aguardando avaliação!
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        const contractToReview = contracts.find(
                          (c) =>
                            c.status === "completed" &&
                            c.workflow_status === "waiting_review"
                        );
                        if (contractToReview) {
                          setContractToReview(contractToReview);
                          setShowReviewModal(true);
                        }
                      }}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Avaliar Agora
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Offer Notification Banner */}
              {user?.role === "brand" && selectedRoom && offers.some(offer => offer.status === 'pending') && (
                <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-300 dark:border-orange-600 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        📋 Você tem uma oferta pendente para este criador
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        const pendingOffer = offers.find(offer => offer.status === 'pending');
                        if (pendingOffer) {
                          handleExistingOffer(pendingOffer.id);
                        }
                      }}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Ver Oferta
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
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
                            <AvatarImage
                              src={`${import.meta.env.VITE_BACKEND_URL ||
                                "https://nexacreators.com.br"
                                }${selectedRoom.other_user.avatar}`}
                            />
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
                            ? "max-w-3xl px-4 py-2"
                            : "max-w-md lg:max-w-2xl xl:max-w-3xl px-4 py-2 rounded-2xl",
                          message.message_type === "system"
                            ? ""
                            : message.is_sender
                              ? "bg-pink-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300"
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
                  ))}
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
                  className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 transition-all duration-300 hover:shadow-md group"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-slate-500 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.mp3,.mp4,.wav,.flac,.avi,.mov,.wmv,.js,.ts,.jsx,.tsx,.html,.css,.json"
                />

                {/* Enhanced File preview */}
                {selectedFile && (
                  <div className="group relative overflow-hidden bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-pink-200 dark:border-pink-800 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] animate-in slide-in-from-bottom-2 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center gap-4 p-4">
                      {filePreview ? (
                        <div className="relative">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-pink-200 dark:border-pink-700 shadow-md group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${getFileColor(
                            selectedFile.name,
                            selectedFile.type.startsWith("image/")
                              ? "image"
                              : "file"
                          )} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                        >
                          {getFileIcon(
                            selectedFile.name,
                            selectedFile.type.startsWith("image/")
                              ? "image"
                              : "file"
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{formatFileSize(selectedFile.size)}</span>
                          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                          <span className="capitalize">
                            {getFileExtension(selectedFile.name)} file
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Ready to send</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 hover:shadow-md group-hover:scale-110"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
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
                    aria-label="Type a message"
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
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 h-12 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                >
                  <Send className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="hidden md:inline font-semibold ml-2">
                    Enviar
                  </span>
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
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Image Viewer */}
      {imageViewer.isOpen &&
        createPortal(
          <div
            ref={imageViewerRef}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={() => {
              setImageViewer({
                isOpen: false,
                imageUrl: "",
                imageName: "",
                imageSize: "",
              });
              setImageZoom(1);
              setImageRotation(0);
            }}
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
                onClick={() =>
                  setImageZoom((prev) => Math.max(prev - 0.25, 0.25))
                }
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setImageZoom((prev) => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Rotate"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setImageZoom(1);
                  setImageRotation(0);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Reset"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={async () => {
                  try {
                    await downloadImageToLocal(
                      imageViewer.imageUrl,
                      imageViewer.imageName
                    );
                  } catch (error) {
                    console.error("Error downloading image:", error);
                  }
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setImageViewer({
                    isOpen: false,
                    imageUrl: "",
                    imageName: "",
                    imageSize: "",
                  });
                  setImageZoom(1);
                  setImageRotation(0);
                }}
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
                  Zoom: {Math.round(imageZoom * 100)}% | Rotation:{" "}
                  {imageRotation}°
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Press + / - to zoom, R to rotate, 0 to reset, D to download,
                  ESC to close
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Offer Modal */}
      {showOfferModal && selectedRoom && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <CreateOffer
            creatorId={selectedRoom.other_user.id}
            creatorName={selectedRoom.other_user.name}
            chatRoomId={selectedRoom.room_id}
            onOfferCreated={handleOfferCreated}
            onCancel={handleOfferCancel}
            onExistingOffer={handleExistingOffer}
            onReloadMessages={() =>
              selectedRoom && loadMessages(selectedRoom.room_id)
            }
          />
        </div>
      )}

      {/* Existing Offer Modal */}
      {showExistingOfferModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Oferta Existente
            </h3>

            {/* Show existing offer details */}
            {existingOfferId && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                  <strong>Oferta Atual:</strong>
                </p>
                {(() => {
                  const existingOffer = offers.find(offer => offer.id === existingOfferId);
                  if (existingOffer) {
                    return (
                      <div className="text-sm">
                        <p><strong>Valor:</strong> {existingOffer.budget}</p>
                        <p><strong>Prazo:</strong> {existingOffer.estimated_days} dias</p>
                        <p><strong>Status:</strong> {existingOffer.status === 'pending' ? 'Pendente' : existingOffer.status}</p>
                        <p><strong>Expira em:</strong> {existingOffer.days_until_expiry} dias</p>
                      </div>
                    );
                  }
                  return <p className="text-sm text-gray-600">Detalhes da oferta não disponíveis</p>;
                })()}
              </div>
            )}

            <p className="text-muted-foreground mb-6">
              Você já tem uma oferta pendente para este criador. Deseja cancelar
              a oferta existente e criar uma nova?
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExistingOfferModal(false);
                  setExistingOfferId(null);
                }}
              >
                Manter Oferta
              </Button>
              <Button
                onClick={handleCancelExistingOffer}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancelar e Criar Nova
              </Button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
