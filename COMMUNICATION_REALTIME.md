# Communication Module - Real-Time WebSocket Integration

## Overview

The Communication Module now includes full real-time capabilities using WebSockets. This enables instant message delivery, typing indicators, online presence, and live announcement notifications.

## Architecture

### Backend WebSocket Server

The existing WebSocket server (`backend/src/core/realtime.js`) has been extended with communication-specific features:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocket Server (ws)                        │
├─────────────────────────────────────────────────────────────────┤
│  Event Types:                                                   │
│  • message:new        - New message in conversation             │
│  • message:update     - Message edited                          │
│  • message:delete     - Message deleted                         │
│  • message:reaction   - Reaction added/removed                  │
│  • message:read       - Message marked as read                  │
│  • typing:start       - User started typing                     │
│  • typing:stop        - User stopped typing                     │
│  • announcement:new   - New announcement published              │
│  • user:online        - User came online                        │
│  • user:offline       - User went offline                       │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Hooks

Custom React hooks in `frontend/src/hooks/useWebSocket.js`:

| Hook | Purpose |
|------|---------|
| `useWebSocket()` | Base hook for WebSocket connection management |
| `useMessagingWebSocket(conversationId)` | Real-time messages, typing, reactions |
| `useAnnouncementsWebSocket()` | Real-time announcement notifications |
| `useOnlineUsersWebSocket()` | Online presence tracking |

## Features

### 1. Real-Time Messaging

Messages appear instantly without page refresh:

```javascript
// Frontend automatically receives new messages
const { newMessage, messageUpdates, typingUsers } = useMessagingWebSocket(conversationId);

// Messages added to state immediately when received
useEffect(() => {
  if (newMessage && newMessage.conversationId === selectedConversation?.id) {
    setMessages(prev => [...prev, newMessage]);
  }
}, [newMessage]);
```

### 2. Typing Indicators

Shows when other users are typing:

- **Debounced**: Only sends typing status after user starts typing
- **Auto-timeout**: Typing indicator stops after 2 seconds of inactivity
- **Visual feedback**: "Someone is typing..." or "3 people are typing..."

```javascript
// Send typing status when user types
const handleTyping = useCallback((e) => {
  setMessageInput(e.target.value);
  setTypingStatus(conversationId, true);
  
  // Clear after 2 seconds of inactivity
  clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => {
    setTypingStatus(conversationId, false);
  }, 2000);
}, [conversationId]);
```

### 3. Online Presence

Track which users are currently online:

```javascript
const { onlineUsers, isUserOnline } = useOnlineUsersWebSocket();

// Check if specific user is online
if (isUserOnline(userId)) {
  // Show green status dot
}
```

### 4. Real-Time Announcements

New announcements appear instantly:

```javascript
const { newAnnouncement } = useAnnouncementsWebSocket();

useEffect(() => {
  if (newAnnouncement) {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    showNotification('New announcement received!');
  }
}, [newAnnouncement]);
```

### 5. Message Updates & Reactions

Live updates when messages are edited or reactions are added:

```javascript
const { messageUpdates } = useMessagingWebSocket(conversationId);

useEffect(() => {
  if (messageUpdates) {
    setMessages(prev => prev.map(msg => 
      msg.id === messageUpdates.id ? messageUpdates : msg
    ));
  }
}, [messageUpdates]);
```

## API Endpoints (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/communication/conversations/:id/typing` | Set typing status |
| GET | `/api/communication/online-users` | Get list of online users |

## WebSocket Connection

### Connection URL
```
ws://localhost:5000?token=<JWT_TOKEN>
```

### Message Format
```javascript
{
  type: 'message:new',
  payload: {
    id: 'uuid',
    content: 'Hello!',
    conversationId: 'uuid',
    senderId: 'uuid',
    createdAt: '2024-01-15T10:30:00Z'
  }
}
```

## Backend Service Methods

The `CommunicationService` automatically broadcasts events:

| Method | Event Broadcasted |
|--------|-------------------|
| `sendMessage()` | `message:new` to all conversation participants |
| `updateMessage()` | `message:update` to all participants |
| `deleteMessage()` | `message:delete` to all participants |
| `addReaction()` | `message:reaction` to all participants |
| `removeReaction()` | `message:reaction` to all participants |
| `markMessageAsRead()` | `message:read` to sender |
| `setTypingStatus()` | `typing:start` / `typing:stop` |
| `createAnnouncement()` | `announcement:new` to all tenant users |

## RealTimeServer Methods (Extended)

```javascript
// Send to specific user
realTimeServer.sendToUser(userId, 'event:type', payload);

// Broadcast to all conversation participants
realTimeServer.broadcastToConversationParticipants(participantUserIds, 'event', payload);

// Broadcast new message
realTimeServer.broadcastMessage(message, participantUserIds);

// Broadcast typing status
realTimeServer.broadcastTyping(conversationId, userId, isTyping, participantUserIds);

// Broadcast announcement to tenant
realTimeServer.broadcastAnnouncement(tenantId, announcement);

// Get online users in tenant
realTimeServer.getOnlineUsers(tenantId);

// Update user online status
realTimeServer.broadcastUserOnlineStatus(userId, tenantId, isOnline);
```

## Security

- **JWT Authentication**: WebSocket connections require valid JWT token
- **Tenant Isolation**: Users only receive events from their tenant
- **Conversation Privacy**: Messages only sent to actual conversation participants

## Performance Considerations

1. **Debounced Typing**: Prevents excessive typing events
2. **Message Deduplication**: Frontend checks for duplicate messages before adding
3. **Lazy Connection**: WebSocket connects only when needed
4. **Auto-Reconnect**: Handles connection drops gracefully

## Testing

### Test WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:5000?token=YOUR_JWT_TOKEN');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Test Typing Indicator
```bash
curl -X POST http://localhost:5000/api/communication/conversations/CONV_ID/typing \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isTyping": true}'
```

## Files Modified

### Backend
- `backend/src/core/realtime.js` - Extended WebSocket server
- `backend/src/modules/communication/communication.service.js` - Added real-time broadcasts
- `backend/src/modules/communication/communication.controller.js` - New endpoints
- `backend/src/modules/communication/communication.routes.js` - New routes

### Frontend
- `frontend/src/hooks/useWebSocket.js` - New WebSocket hooks
- `frontend/src/api/communication.js` - New API functions
- `frontend/src/pages/communication/MessagingPage.jsx` - Real-time messages & typing
- `frontend/src/pages/communication/AnnouncementsPage.jsx` - Real-time announcements

## Future Enhancements

- [ ] WebSocket reconnection with exponential backoff
- [ ] Message delivery receipts
- [ ] Read receipts with user names
- [ ] Push notifications for mobile
- [ ] Message search indexing
- [ ] File upload progress via WebSocket
