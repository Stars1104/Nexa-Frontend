# Real-Time Chat Implementation

## Overview

This document describes the simplified real-time chat system implementation for the Nexa platform, featuring campaign-based messaging between brands and creators.

## Features

### ✅ Core Chat Features

- **Real-time messaging** using Socket.IO
- **File upload and sharing** (images, documents, PDFs)
- **Typing indicators** with debouncing
- **Message read receipts**
- **Online/offline status**
- **Message search and filtering**
- **Mobile responsive design**

### ✅ Campaign-Based Chat

- **Chat rooms created** when brands accept creator applications
- **Campaign context** for all conversations
- **Creator-brand communication** for campaign discussions

### ✅ Enhanced UI/UX

- **Modern chat interface** with gradient styling
- **Real-time notifications** and badges
- **File preview** for images
- **Progress indicators** for uploads
- **Error handling** and reconnection logic
- **Keyboard shortcuts** (Enter to send, Escape to close)

## Architecture

### Frontend Components

#### 1. Enhanced Chat Component (`src/components/Chat.tsx`)

The main chat interface with:

- **Campaign-based conversations**: All chats are tied to campaigns
- **Real-time updates**: Messages, typing indicators, read receipts
- **File handling**: Upload, preview, and download
- **Search functionality**: Filter conversations by name or campaign
- **Mobile responsive**: Hamburger menu and touch-friendly interface

#### 2. Chat Room Creator (`src/components/ChatRoomCreator.tsx`)

Component for creating chat rooms from campaign applications:

- **Application context**: Shows creator and campaign details
- **Confirmation dialog**: Clear information about chat room creation
- **Navigation**: Automatically redirects to chat after creation
- **Error handling**: Displays validation and API errors

### Backend Services

#### 1. Chat Service (`src/services/chatService.ts`)

Service with methods for:

- **Campaign chat rooms**: Get, create, send messages
- **Message management**: Send text and file messages
- **Online status**: Update user online/offline status
- **Read receipts**: Mark messages as read

#### 2. Socket.IO Hook (`src/hooks/useSocket.ts`)

Advanced Socket.IO integration with:

- **Automatic reconnection**: Exponential backoff strategy
- **Error handling**: Connection error states and recovery
- **Event management**: Message, typing, read receipt events
- **Room management**: Join/leave chat rooms
- **File upload**: Real-time file sharing

#### 3. Chat Navigation Hook (`src/hooks/useChatNavigation.ts`)

Navigation utilities for:

- **Chat room creation**: Create and navigate to new rooms
- **URL management**: Handle chat room URLs and parameters
- **Seamless navigation**: Smooth transitions between pages

## API Endpoints

### Chat Routes

```
GET    /api/chat/rooms                    # Get user's campaign chat rooms
GET    /api/chat/rooms/{roomId}/messages  # Get messages for a room
POST   /api/chat/rooms                    # Create chat room
POST   /api/chat/messages                 # Send message
POST   /api/chat/online-status            # Update online status
POST   /api/chat/typing-status            # Update typing status
```

## Socket.IO Events

### Client to Server

```javascript
// User joins with authentication
socket.emit("user_join", { userId, userRole });

// Join/leave chat room
socket.emit("join_room", roomId);
socket.emit("leave_room", roomId);

// Send message
socket.emit("send_message", {
  roomId,
  message,
  senderId,
  senderName,
  senderAvatar,
  messageType,
  fileData,
});

// Typing indicators
socket.emit("typing_start", { roomId, userId, userName });
socket.emit("typing_stop", { roomId, userId });

// Mark messages as read
socket.emit("mark_read", { roomId, messageIds, userId });
```

### Server to Client

```javascript
// New message received
socket.on("new_message", {
  roomId,
  message,
  senderId,
  senderName,
  senderAvatar,
  messageType,
  fileData,
  timestamp,
});

// Typing indicator
socket.on("user_typing", {
  roomId,
  userId,
  userName,
  isTyping,
});

// Messages read
socket.on("messages_read", {
  roomId,
  messageIds,
  readBy,
  timestamp,
});
```

## Usage Examples

### 1. Creating Chat Room from Application

```tsx
import ChatRoomCreator from "../components/ChatRoomCreator";

// In your application list component
<ChatRoomCreator
  application={application}
  onChatCreated={(roomId) => {
    // Navigate to chat or show notification
  }}
/>;
```

### 2. Using Chat Navigation Hook

```tsx
import { useChatNavigation } from "../hooks/useChatNavigation";

const { navigateToChatWithRoom } = useChatNavigation();

// Create chat room and navigate
await navigateToChatWithRoom(campaignId, creatorId);
```

### 3. Using Enhanced Chat Service

```tsx
import { chatService } from "../services/chatService";

// Create chat room
const response = await chatService.createChatRoom(campaignId, creatorId);

// Send message
const message = await chatService.sendTextMessage(roomId, "Hello!");

// Send file
const fileMessage = await chatService.sendFileMessage(roomId, file);
```

## Setup Instructions

### 1. Start Socket.IO Server

```bash
cd backend
node socket-server.js
```

### 2. Ensure Laravel Backend is Running

```bash
cd backend
php artisan serve
```

### 3. Start Frontend

```bash
cd nexa
npm run dev
```

### 4. Configure Environment

Make sure your `.env` files are properly configured with:

- Database credentials
- File storage settings
- Socket.IO server URL (default: `http://localhost:3001`)

## File Structure

```
nexa/src/
├── components/
│   ├── Chat.tsx                    # Main chat interface
│   └── ChatRoomCreator.tsx         # Chat room creation dialog
├── hooks/
│   ├── useSocket.ts               # Socket.IO integration
│   └── useChatNavigation.ts       # Chat navigation utilities
├── services/
│   └── chatService.ts             # Chat API service
└── pages/
    └── creator/
        └── Index.tsx              # Updated to include Chat component

backend/
├── app/Http/Controllers/
│   └── ChatController.php         # Campaign chat endpoints
├── app/Models/
│   ├── ChatRoom.php              # Campaign chat rooms
│   └── Message.php               # Chat messages
├── database/migrations/          # Database schema
└── socket-server.js              # Socket.IO server
```

## Key Features Implementation

### Real-Time Messaging

- **Socket.IO integration** with automatic reconnection
- **Message persistence** in database
- **Real-time delivery** to all room participants
- **Offline message queuing** (messages stored when user is offline)

### File Sharing

- **Multiple file types**: Images, PDFs, documents, text files
- **File size limits**: 10MB maximum
- **Image preview**: Thumbnail generation for images
- **Download links**: Secure file access URLs
- **Progress tracking**: Upload progress indicators

### Typing Indicators

- **Debounced typing**: Prevents spam of typing events
- **Real-time updates**: Shows who is currently typing
- **Auto-clear**: Automatically stops after 2 seconds of inactivity
- **Room-specific**: Only shows for current chat room

### Campaign-Based Chat

- **Application-triggered**: Chat rooms created when brands accept applications
- **Campaign context**: All conversations tied to specific campaigns
- **Creator-brand communication**: Direct messaging for campaign discussions
- **Automatic room creation**: Seamless transition from application to chat

### Mobile Responsiveness

- **Hamburger menu**: Collapsible sidebar on mobile
- **Touch-friendly**: Large touch targets and gestures
- **Responsive layout**: Adapts to different screen sizes
- **Keyboard handling**: Proper mobile keyboard behavior

## Error Handling

### Connection Errors

- **Automatic reconnection**: Exponential backoff strategy
- **Error states**: Clear indication of connection status
- **Manual reconnect**: Button to manually retry connection
- **Graceful degradation**: Works offline with message queuing

### API Errors

- **Validation errors**: Clear error messages for invalid input
- **Authentication errors**: Proper redirect to login
- **Network errors**: Retry mechanisms and user feedback
- **File upload errors**: Progress tracking and error recovery

## Performance Optimizations

### Frontend

- **Message virtualization**: Only render visible messages
- **Debounced search**: Prevents excessive API calls
- **Lazy loading**: Load messages on demand
- **Image optimization**: Compressed thumbnails and lazy loading

### Backend

- **Database indexing**: Optimized queries for chat rooms and messages
- **Eager loading**: Reduce N+1 queries with relationships
- **Caching**: Redis caching for frequently accessed data
- **File storage**: Efficient file handling with CDN support

## Security Considerations

### Authentication

- **Token-based auth**: Laravel Sanctum for API authentication
- **Socket authentication**: User verification on connection
- **Room access control**: Users can only access their own chat rooms

### File Security

- **File validation**: Type and size restrictions
- **Secure storage**: Files stored in protected directories
- **Access control**: Files only accessible to chat participants
- **Virus scanning**: Optional file scanning for security

### Data Privacy

- **Message encryption**: End-to-end encryption (future enhancement)
- **Data retention**: Configurable message retention policies
- **GDPR compliance**: User data deletion capabilities
- **Audit logging**: Track message access and modifications

## Testing

### Unit Tests

```bash
# Frontend tests
npm test

# Backend tests
php artisan test
```

### Integration Tests

- **Socket.IO connection**: Test real-time functionality
- **File upload**: Test file sharing capabilities
- **Chat room creation**: Test campaign application to chat flow
- **Message delivery**: Test real-time message delivery

## Deployment

### Production Setup

1. **Environment variables**: Configure production settings
2. **Database migration**: Run migrations on production database
3. **File storage**: Configure production file storage (S3, etc.)
4. **Socket.IO server**: Deploy with PM2 or similar process manager
5. **SSL certificates**: Enable HTTPS for secure connections
6. **CDN setup**: Configure CDN for file delivery

### Monitoring

- **Connection monitoring**: Track Socket.IO connection health
- **Error tracking**: Monitor API and frontend errors
- **Performance metrics**: Track message delivery times
- **User analytics**: Monitor chat usage patterns

## Future Enhancements

### Planned Features

- **Video calls**: WebRTC integration for voice/video
- **Message reactions**: Emoji reactions to messages
- **Message editing**: Edit sent messages
- **Message deletion**: Delete messages with time limits
- **Advanced search**: Full-text search across messages
- **Message scheduling**: Schedule messages for later delivery

### Technical Improvements

- **End-to-end encryption**: Message encryption for privacy
- **Message synchronization**: Better offline/online sync
- **Push notifications**: Mobile push notifications
- **Message translation**: Real-time message translation
- **AI integration**: Smart replies and message suggestions
- **Advanced analytics**: Detailed chat analytics and insights

## Support

For questions or issues with the real-time chat implementation:

1. **Check logs**: Review browser console and server logs
2. **Verify connections**: Ensure Socket.IO server is running
3. **Test authentication**: Verify user tokens are valid
4. **Check database**: Ensure all tables are migrated
5. **Review configuration**: Verify environment variables

The implementation provides a robust, scalable, and user-friendly real-time chat system that enhances communication between brands and creators on the Nexa platform through campaign-based conversations.
