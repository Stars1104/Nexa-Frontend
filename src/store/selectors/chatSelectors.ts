import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selectors
export const selectChatState = (state: RootState) => state.chat;

export const selectChatRooms = (state: RootState) => state.chat.rooms;
export const selectSelectedRoomId = (state: RootState) => state.chat.selectedRoomId;
export const selectChatMessages = (state: RootState) => state.chat.messages;
export const selectChatLoading = (state: RootState) => state.chat.isLoading;
export const selectChatError = (state: RootState) => state.chat.error;
export const selectTypingUsers = (state: RootState) => state.chat.typingUsers;
export const selectUnreadCounts = (state: RootState) => state.chat.unreadCounts;
export const selectLastMessageTimestamps = (state: RootState) => state.chat.lastMessageTimestamps;

// Computed selectors
export const selectSelectedRoom = createSelector(
  [selectChatRooms, selectSelectedRoomId],
  (rooms, selectedRoomId) => {
    if (!selectedRoomId) return null;
    return rooms.find(room => room.room_id === selectedRoomId) || null;
  }
);

export const selectSelectedRoomMessages = createSelector(
  [selectChatMessages, selectSelectedRoomId],
  (messages, selectedRoomId) => {
    if (!selectedRoomId) return [];
    return messages[selectedRoomId] || [];
  }
);

export const selectSelectedRoomTypingUsers = createSelector(
  [selectTypingUsers, selectSelectedRoomId],
  (typingUsers, selectedRoomId) => {
    if (!selectedRoomId) return [];
    return typingUsers[selectedRoomId] || [];
  }
);

export const selectSelectedRoomUnreadCount = createSelector(
  [selectUnreadCounts, selectSelectedRoomId],
  (unreadCounts, selectedRoomId) => {
    if (!selectedRoomId) return 0;
    return unreadCounts[selectedRoomId] || 0;
  }
);

export const selectTotalUnreadCount = createSelector(
  [selectUnreadCounts],
  (unreadCounts) => {
    return Object.values(unreadCounts).reduce((total: number, count: number) => total + count, 0);
  }
);

export const selectRoomById = (roomId: string) => createSelector(
  [selectChatRooms],
  (rooms) => rooms.find(room => room.room_id === roomId) || null
);

export const selectMessagesByRoomId = (roomId: string) => createSelector(
  [selectChatMessages],
  (messages) => messages[roomId] || []
);

export const selectTypingUsersByRoomId = (roomId: string) => createSelector(
  [selectTypingUsers],
  (typingUsers) => typingUsers[roomId] || []
);

export const selectUnreadCountByRoomId = (roomId: string) => createSelector(
  [selectUnreadCounts],
  (unreadCounts) => unreadCounts[roomId] || 0
);

// Room sorting and filtering
export const selectSortedChatRooms = createSelector(
  [selectChatRooms, selectLastMessageTimestamps],
  (rooms, timestamps) => {
    return [...rooms].sort((a, b) => {
      const aTimestamp = timestamps[a.room_id] || a.last_message_at || '1970-01-01T00:00:00Z';
      const bTimestamp = timestamps[b.room_id] || b.last_message_at || '1970-01-01T00:00:00Z';
      return new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime();
    });
  }
);

export const selectRoomsWithUnreadMessages = createSelector(
  [selectSortedChatRooms, selectUnreadCounts],
  (rooms, unreadCounts) => {
    return rooms.filter(room => (unreadCounts[room.room_id] || 0) > 0);
  }
);

// Message utilities
export const selectMessageById = (roomId: string, messageId: number) => createSelector(
  [selectMessagesByRoomId(roomId)],
  (messages) => messages.find(msg => msg.id === messageId) || null
);

export const selectLastMessageInRoom = (roomId: string) => createSelector(
  [selectMessagesByRoomId(roomId)],
  (messages) => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  }
); 