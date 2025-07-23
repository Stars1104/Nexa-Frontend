# Chat Functionality Implementation

## Overview

The chat functionality allows brands to communicate with creators after approving their campaign applications. The system provides a complete chat experience with user information display, real-time messaging, and file sharing capabilities.

## Features

### 1. User Context Display

- **Brand Dashboard**: Shows all chat conversations with creators
- **User Information**: Displays creator name, avatar, and campaign context
- **Real-time Status**: Shows online/offline status and typing indicators

### 2. Chat Navigation

- **Direct Chat Access**: From ViewCreators component when brand approves an application
- **General Chat Access**: From BrandDashboard for all conversations
- **Back Navigation**: Easy return to dashboard with back button

### 3. Chat Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **File Sharing**: Support for images, documents, and other files
- **Message Status**: Read receipts and delivery confirmation
- **Search**: Filter conversations by creator name or campaign title
- **Mobile Responsive**: Works seamlessly on mobile devices

## Implementation Details

### Frontend Components

#### 1. ChatPage (`src/pages/brand/ChatPage.tsx`)

- Main chat interface for brands
- Displays user information and conversation history
- Handles message sending and file uploads
- Manages real-time connections

#### 2. Brand Chat Navigation (`src/hooks/useBrandChatNavigation.ts`)

- Handles chat room creation and navigation
- Integrates with component-based routing system
- Manages localStorage for selected chat rooms

#### 3. Updated Components

- **ViewCreators**: Chat button creates room and navigates to chat
- **BrandDashboard**: General chat access for all conversations
- **BrandIndex**: Routes to ChatPage component

### Backend API

#### Chat Endpoints

- `GET /api/chat/rooms` - Get user's chat rooms
- `GET /api/chat/rooms/{roomId}/messages` - Get messages for a room
- `POST /api/chat/rooms` - Create chat room (brand accepts proposal)
- `POST /api/chat/messages` - Send a message
- `POST /api/chat/typing-status` - Update typing status

#### Chat Room Creation

- Only brands can create chat rooms
- Requires approved campaign application
- Prevents duplicate rooms for same campaign/creator pair

## User Flow

### 1. Brand Approves Creator Application

1. Brand views applications in ViewCreators component
2. Clicks "Aprovar" button to approve application
3. Chat button becomes available for approved creators
4. Clicking "Chat" creates chat room and navigates to ChatPage

### 2. Chat Interface

1. ChatPage loads with creator information displayed
2. Shows conversation history and real-time messages
3. Brand can send text messages and files
4. Real-time typing indicators and read receipts

### 3. Navigation

1. Back button returns to dashboard
2. Sidebar shows all conversations
3. Search functionality filters conversations
4. Mobile hamburger menu for responsive design

## Technical Implementation

### State Management

- Redux for user authentication and global state
- Local state for chat rooms, messages, and UI state
- localStorage for selected chat room persistence

### Real-time Communication

- Socket.IO for real-time messaging
- Typing indicators and online status
- Message delivery confirmation

### File Handling

- File upload with preview
- Support for multiple file types
- File size validation and storage

### Security

- Authentication required for all chat endpoints
- User can only access their own conversations
- File upload validation and sanitization

## Usage Examples

### Creating a Chat Room

```typescript
const { navigateToChatWithRoom } = useBrandChatNavigation();

// When brand approves creator application
await navigateToChatWithRoom(campaignId, creatorId, setComponent);
```

### Sending a Message

```typescript
// Text message
await chatService.sendTextMessage(roomId, "Hello!");

// File message
await chatService.sendFileMessage(roomId, file);
```

### Loading Chat Rooms

```typescript
const rooms = await chatService.getChatRooms();
// Returns array of ChatRoom objects with user information
```

## Mobile Responsiveness

The chat interface is fully responsive with:

- Mobile hamburger menu for sidebar
- Touch-friendly buttons and inputs
- Optimized layout for small screens
- Proper keyboard handling on mobile devices

## Error Handling

- Network error recovery with reconnect functionality
- Graceful handling of missing user data
- File upload error handling
- Message delivery failure recovery

## Future Enhancements

- Push notifications for new messages
- Message reactions and emoji support
- Voice and video calling integration
- Message encryption for enhanced security
- Chat room archiving and search functionality
