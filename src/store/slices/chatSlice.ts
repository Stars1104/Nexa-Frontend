import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatService, ChatRoom, Message } from '../../services/chatService';

// Async thunks
export const fetchChatRooms = createAsyncThunk(
  'chat/fetchChatRooms',
  async (_, { rejectWithValue }) => {
    try {
      const rooms = await chatService.getChatRooms();
      return rooms;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat rooms');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await chatService.getMessages(roomId);
      return { roomId, messages: response.messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ roomId, message, messageType = 'text' }: { roomId: string; message: string; messageType?: string }, { rejectWithValue }) => {
    try {
      let response;
      if (messageType === 'file') {
        // Handle file message - you'll need to implement this
        throw new Error('File messages not yet implemented in Redux');
      } else {
        response = await chatService.sendTextMessage(roomId, message);
      }
      return { roomId, message: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async ({ roomId, messageIds }: { roomId: string; messageIds: number[] }, { rejectWithValue }) => {
    try {
      await chatService.markMessagesAsRead(roomId, messageIds);
      return { roomId, messageIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }
);

// Types
interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>; // roomId -> messages
  selectedRoomId: string | null;
  isLoading: boolean;
  error: string | null;
  typingUsers: Record<string, string[]>; // roomId -> Array of typing user IDs
  unreadCounts: Record<string, number>; // roomId -> unread count
  lastMessageTimestamps: Record<string, string>; // roomId -> last message timestamp
}

const initialState: ChatState = {
  rooms: [],
  messages: {},
  selectedRoomId: null,
  isLoading: false,
  error: null,
  typingUsers: {},
  unreadCounts: {},
  lastMessageTimestamps: {},
};

// Helper function to sort messages by timestamp
const sortMessagesByTimestamp = (messages: Message[]): Message[] => {
  return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedRoom: (state, action: PayloadAction<string | null>) => {
      state.selectedRoomId = action.payload;
    },
    
    addMessage: (state, action: PayloadAction<{ roomId: string; message: Message }>) => {
      const { roomId, message } = action.payload;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Check if message already exists to avoid duplicates
      const messageExists = state.messages[roomId].some(msg => msg.id === message.id);
      if (!messageExists) {
        state.messages[roomId].push(message);
        
        // Sort messages by timestamp to maintain proper order
        state.messages[roomId] = sortMessagesByTimestamp(state.messages[roomId]);
        
        // Update last message timestamp
        state.lastMessageTimestamps[roomId] = message.created_at;
        
        // Update unread count if message is from other user
        if (!message.is_sender) {
          state.unreadCounts[roomId] = (state.unreadCounts[roomId] || 0) + 1;
        }
      }
    },
    
    insertMessageAtBeginning: (state, action: PayloadAction<{ roomId: string; message: Message }>) => {
      const { roomId, message } = action.payload;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Check if message already exists to avoid duplicates
      const messageExists = state.messages[roomId].some(msg => msg.id === message.id);
      if (!messageExists) {
        // Insert at the beginning of the array
        state.messages[roomId].unshift(message);
        
        // Sort messages by timestamp to maintain proper order
        state.messages[roomId] = sortMessagesByTimestamp(state.messages[roomId]);
        
        // Update last message timestamp if this is the only message
        if (state.messages[roomId].length === 1) {
          state.lastMessageTimestamps[roomId] = message.created_at;
        }
        
        // Update unread count if message is from other user
        if (!message.is_sender) {
          state.unreadCounts[roomId] = (state.unreadCounts[roomId] || 0) + 1;
        }
      }
    },
    
    setMessagesForRoom: (state, action: PayloadAction<{ roomId: string; messages: Message[] }>) => {
      const { roomId, messages } = action.payload;
      
      // Initialize messages array if it doesn't exist
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Merge new messages with existing ones, avoiding duplicates
      const existingMessageIds = new Set(state.messages[roomId].map(msg => msg.id));
      const newMessages = messages.filter(message => !existingMessageIds.has(message.id));
      
      // Add new messages to the existing array
      state.messages[roomId].push(...newMessages);
      
      // Sort messages by creation time to maintain order
      state.messages[roomId] = sortMessagesByTimestamp(state.messages[roomId]);
      
      // Update last message timestamp if messages exist
      if (state.messages[roomId].length > 0) {
        state.lastMessageTimestamps[roomId] = state.messages[roomId][state.messages[roomId].length - 1].created_at;
      }
      
      // Update unread count
      const unreadCount = state.messages[roomId].filter(msg => !msg.is_sender && !msg.is_read).length;
      state.unreadCounts[roomId] = unreadCount;
    },
    
    updateMessage: (state, action: PayloadAction<{ roomId: string; messageId: number; updates: Partial<Message> }>) => {
      const { roomId, messageId, updates } = action.payload;
      
      if (state.messages[roomId]) {
        const messageIndex = state.messages[roomId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.messages[roomId][messageIndex] = { ...state.messages[roomId][messageIndex], ...updates };
        }
      }
    },
    
    setTypingUser: (state, action: PayloadAction<{ roomId: string; userId: string; isTyping: boolean }>) => {
      const { roomId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }
      
      if (isTyping) {
        if (!state.typingUsers[roomId].includes(userId)) {
          state.typingUsers[roomId].push(userId);
        }
      } else {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(id => id !== userId);
      }
    },
    
    clearTypingUsers: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      state.typingUsers[roomId] = [];
    },
    
    clearMessages: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      state.messages[roomId] = [];
    },
    
    markRoomMessagesAsRead: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      
      if (state.messages[roomId]) {
        state.messages[roomId].forEach(message => {
          if (!message.is_sender) {
            message.is_read = true;
            message.read_at = new Date().toISOString();
          }
        });
      }
      
      state.unreadCounts[roomId] = 0;
    },
    
    updateRoomLastMessage: (state, action: PayloadAction<{ roomId: string; message: Message }>) => {
      const { roomId, message } = action.payload;
      
      const roomIndex = state.rooms.findIndex(room => room.room_id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].last_message = {
          id: message.id,
          message: message.message,
          message_type: message.message_type,
          sender_id: message.sender_id,
          is_sender: message.is_sender,
          created_at: message.created_at,
        };
        state.rooms[roomIndex].last_message_at = message.created_at;
      }
    },
    
    addRoom: (state, action: PayloadAction<ChatRoom>) => {
      const room = action.payload;
      const existingRoomIndex = state.rooms.findIndex(r => r.room_id === room.room_id);
      
      if (existingRoomIndex !== -1) {
        // Update existing room
        state.rooms[existingRoomIndex] = room;
      } else {
        // Add new room
        state.rooms.push(room);
        // Initialize typingUsers for the new room
        if (!state.typingUsers[room.room_id]) {
          state.typingUsers[room.room_id] = [];
        }
      }
    },
    
    updateRoom: (state, action: PayloadAction<{ roomId: string; updates: Partial<ChatRoom> }>) => {
      const { roomId, updates } = action.payload;
      const roomIndex = state.rooms.findIndex(room => room.room_id === roomId);
      
      if (roomIndex !== -1) {
        state.rooms[roomIndex] = { ...state.rooms[roomIndex], ...updates };
      }
    },
    
    removeRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      state.rooms = state.rooms.filter(room => room.room_id !== roomId);
      
      // Clean up related data
      delete state.messages[roomId];
      delete state.typingUsers[roomId];
      delete state.unreadCounts[roomId];
      delete state.lastMessageTimestamps[roomId];
      
      // If this was the selected room, clear selection
      if (state.selectedRoomId === roomId) {
        state.selectedRoomId = null;
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetChat: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat rooms
      .addCase(fetchChatRooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rooms = action.payload;
        state.error = null;
        
        // Initialize typingUsers for all rooms to ensure they are Sets
        action.payload.forEach(room => {
          if (!state.typingUsers[room.room_id]) {
            state.typingUsers[room.room_id] = [];
          }
        });
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch messages - FIXED: Now merges instead of replacing
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { roomId, messages } = action.payload;
        state.isLoading = false;
        
        // Initialize messages array if it doesn't exist
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        
        // Merge new messages with existing ones, avoiding duplicates
        const existingMessageIds = new Set(state.messages[roomId].map(msg => msg.id));
        const newMessages = messages.filter(message => !existingMessageIds.has(message.id));
        
        // Add new messages to the existing array
        state.messages[roomId].push(...newMessages);
        
        // Sort messages by creation time to maintain order
        state.messages[roomId] = sortMessagesByTimestamp(state.messages[roomId]);
        
        state.error = null;
        
        // Update unread count
        const unreadCount = state.messages[roomId].filter(msg => !msg.is_sender && !msg.is_read).length;
        state.unreadCounts[roomId] = unreadCount;
        
        // Update last message timestamp
        if (state.messages[roomId].length > 0) {
          state.lastMessageTimestamps[roomId] = state.messages[roomId][state.messages[roomId].length - 1].created_at;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { roomId, message } = action.payload;
        
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        
        // Check if message already exists to avoid duplicates
        const messageExists = state.messages[roomId].some(msg => msg.id === message.id);
        if (!messageExists) {
          // Add the new message
          state.messages[roomId].push(message);
          
          // Sort messages by timestamp to maintain proper order
          state.messages[roomId] = sortMessagesByTimestamp(state.messages[roomId]);
          
          // Update last message timestamp
          state.lastMessageTimestamps[roomId] = message.created_at;
          
          // Update room's last message
          const roomIndex = state.rooms.findIndex(room => room.room_id === roomId);
          if (roomIndex !== -1) {
            state.rooms[roomIndex].last_message = {
              id: message.id,
              message: message.message,
              message_type: message.message_type,
              sender_id: message.sender_id,
              is_sender: message.is_sender,
              created_at: message.created_at,
            };
            state.rooms[roomIndex].last_message_at = message.created_at;
          }
        }
      })
      
      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { roomId, messageIds } = action.payload;
        
        if (state.messages[roomId]) {
          state.messages[roomId].forEach(message => {
            if (messageIds.includes(message.id)) {
              message.is_read = true;
              message.read_at = new Date().toISOString();
            }
          });
        }
        
        // Recalculate unread count
        if (state.messages[roomId]) {
          const unreadCount = state.messages[roomId].filter(msg => !msg.is_sender && !msg.is_read).length;
          state.unreadCounts[roomId] = unreadCount;
        }
      });
  },
});

export const {
  setSelectedRoom,
  addMessage,
  insertMessageAtBeginning,
  setMessagesForRoom,
  updateMessage,
  setTypingUser,
  clearTypingUsers,
  clearMessages,
  markRoomMessagesAsRead,
  updateRoomLastMessage,
  addRoom,
  updateRoom,
  removeRoom,
  clearError,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
