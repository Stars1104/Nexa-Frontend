import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
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
  Briefcase,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { chatService, ChatRoom, Message } from "../services/chatService";
import { useAppSelector } from "../store/hooks";
import { format, isToday, isYesterday } from "date-fns";
import ChatOfferMessage, { ChatOffer } from "./ChatOfferMessage";
import { hiringApi } from "../api/hiring";
import { useToast } from "../hooks/use-toast";
import ReviewModal from "./creator/ReviewModal";

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
        // Only add message if it's from another user (not the current user)
        if (data.senderId !== user?.id) {
          const messageId = data.messageId || Math.floor(Date.now() / 1000);
          const newMessage: Message = {
            id: messageId,
            message: data.message,
            message_type: data.messageType || "text",
            sender_id: data.senderId,
            sender_name: data.senderName,
            sender_avatar: data.senderAvatar,
            is_sender: false, // This is from another user
            file_path: data.fileData?.file_path,
            file_name: data.fileData?.file_name,
            file_size: data.fileData?.file_size,
            file_type: data.fileData?.file_type,
            file_url: data.fileData?.file_url,
            is_read: false,
            created_at: data.timestamp || new Date().toISOString(),
          };

          setMessages((prev) => [...prev, newMessage]);

          // Mark as read immediately if it's not from current user
          markMessagesAsRead(data.roomId, [messageId]).catch((error) => {
            console.warn("Error marking message as read:", error);
          });
        }
      } else {
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
      const roomsData = await chatService.getChatRooms();
      if (isMountedRef.current) {
        setChatRooms(roomsData);

        // Auto-select first room if none selected and rooms exist
        if (!selectedRoom && roomsData.length > 0) {
          handleConversationSelect(roomsData[0]);
        }
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
    }
  };

  // Load messages for a specific room
  const loadMessages = async (room: ChatRoom) => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      console.log(`Loading messages for room: ${room.room_id}`);
      const response = await chatService.getMessages(room.room_id);
      if (isMountedRef.current) {
        console.log(
          `Loaded ${response.messages.length} messages for room: ${room.room_id}`
        );

        // Only deduplicate if there are actual duplicates (same message ID)
        const messageIds = new Set();
        const deduplicatedMessages = response.messages.filter((message) => {
          if (messageIds.has(message.id)) {
            console.log(`Removing duplicate message with ID: ${message.id}`);
            return false; // Skip duplicate message IDs
          }
          messageIds.add(message.id);
          return true;
        });

        console.log(
          `After deduplication: ${deduplicatedMessages.length} messages`
        );
        setMessages(deduplicatedMessages);

        // Join the room for real-time updates
        joinRoom(room.room_id);

        // Mark all unread messages from other users as read
        const unreadMessages = deduplicatedMessages.filter(
          (msg) => !msg.is_sender && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          markMessagesAsRead(
            room.room_id,
            unreadMessages.map((msg) => msg.id)
          );
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
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
              console.log(
                `Fetching review status for contract ${contract.id}...`
              );
              const reviewStatusResponse =
                await hiringApi.getContractReviewStatus(contract.id);
              console.log(
                `Review status for contract ${contract.id}:`,
                reviewStatusResponse.data
              );
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
        setMessages((prev) => [...prev, newMessage]);
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
        console.error("Error downloading image:", error);

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
          console.error("Fallback method also failed:", fallbackError);
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
          console.error("Error downloading file:", error);

          try {
            const downloadUrl = message.file_url.replace(
              "/storage/",
              "/api/download/"
            );
            window.open(downloadUrl, "_blank", "noopener,noreferrer");
          } catch (fallbackError) {
            console.error("Fallback method also failed:", fallbackError);
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
                          : "Unknown size")}
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
                      ? "View Image"
                      : "Open File"}
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
                        ? `Downloading ${downloadProgress}%`
                        : "Downloading..."
                      : message.message_type === "image"
                      ? "Download Image"
                      : "Download File"}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <File className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
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
            <p className="text-sm text-slate-700 dark:text-slate-300">
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
      // Check if this is a contract completion message and user can review
      const canReview = contracts.some(
        (contract) =>
          contract.status === "completed" && contract.can_review === true
      );

      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">ℹ️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium leading-relaxed">
                {message.message}
              </p>

              {/* Review button for completed contracts */}
              {canReview && (
                <div className="mt-3 flex justify-center">
                  <Button
                    onClick={() => {
                      const contractToReview = contracts.find(
                        (contract) =>
                          contract.status === "completed" &&
                          contract.can_review === true
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

                        console.log("Contract to review:", contractToReview);
                        setContractToReview(contractToReview);
                        setShowReviewModal(true);
                        console.log(
                          "System message opening review modal for contract:",
                          contractToReview.id
                        );
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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        {message.message}
      </p>
    );
  };

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
    try {
      await hiringApi.acceptOffer(offerId);
      toast({
        title: "Sucesso",
        description: "Oferta aceita com sucesso!",
      });
      // Reload all data to show updated status
      if (selectedRoom) {
        loadMessages(selectedRoom);
        loadContracts(selectedRoom.room_id);
      }
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao aceitar oferta",
        variant: "destructive",
      });
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      await hiringApi.rejectOffer(offerId);
      toast({
        title: "Sucesso",
        description: "Oferta rejeitada com sucesso!",
      });
      // Reload all data to show updated status
      if (selectedRoom) {
        loadMessages(selectedRoom);
        loadContracts(selectedRoom.room_id);
      }
    } catch (error: any) {
      console.error("Error rejecting offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao rejeitar oferta",
        variant: "destructive",
      });
    }
  };

  const handleCancelOffer = async (offerId: number) => {
    try {
      await hiringApi.cancelOffer(offerId);
      toast({
        title: "Sucesso",
        description: "Oferta cancelada com sucesso!",
      });
      // Reload messages to show updated offer status
      if (selectedRoom) {
        loadMessages(selectedRoom);
      }
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
      // Reload messages and contracts to show updated status
      if (selectedRoom) {
        loadMessages(selectedRoom);
        loadContracts(selectedRoom.room_id);
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
      {/* Mobile Hamburger Button */}
      <button
        data-hamburger
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg"
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
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin " />
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
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2",
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
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
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
    </div>
  );
}
