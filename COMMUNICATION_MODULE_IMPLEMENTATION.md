# Communication Module - Implementation Guide

## Overview

The Communication Module provides comprehensive internal communication, collaboration, and announcement features for your ERP system. It includes:

- **Internal Messaging/Chat**: Direct and group conversations with real-time capabilities
- **Announcements**: Company-wide or targeted announcements with priority levels
- **Team Channels**: Public and private channels for team collaboration
- **Email Integration**: Email template management and email sending capabilities

---

## Database Schema

### Core Models

#### **Conversation**
Manages chat conversations (direct, group, or channel-based)
- `type`: DIRECT | GROUP | CHANNEL
- `name`: Optional name for group chats
- `createdBy`: User who created the conversation
- `isArchived`: Archive status
- `lastMessageAt`: Timestamp of last message

#### **Message**
Individual messages within conversations
- `content`: Message text content
- `type`: TEXT | FILE | IMAGE | SYSTEM
- `attachments`: JSON array of file metadata
- `mentionedUserIds`: Array of mentioned user IDs
- `replyToId`: Reference to replied message
- `reactions`: Message reactions (emoji)
- `readReceipts`: Read status tracking

#### **Announcement**
Company-wide or targeted announcements
- `title`: Announcement title
- `content`: Full announcement text
- `priority`: LOW | NORMAL | HIGH | URGENT
- `targetType`: ALL | DEPARTMENT | ROLE | SPECIFIC_USERS
- `targetIds`: JSON array of target IDs
- `isPinned`: Pin to top of list
- `expiresAt`: Optional expiration date

#### **ChatChannel**
Team collaboration channels
- `type`: PUBLIC | PRIVATE
- `name`: Channel name
- `departmentId`: Optional department association
- `projectId`: Optional project association

#### **EmailTemplate**
Reusable email templates
- `code`: Unique identifier for programmatic use
- `subject`: Email subject line
- `body`: HTML email body
- `variables`: Available template variables

#### **EmailLog**
Email sending history and status
- `status`: PENDING | SENT | FAILED | BOUNCED
- `sentAt`: Timestamp when sent
- `errorMessage`: Error details if failed

---

## Backend API

### Base URL
All communication endpoints are prefixed with `/api/communication`

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### **Conversations**

**GET** `/conversations`
- Get all conversations for the authenticated user
- Query params: `type` (DIRECT | GROUP | CHANNEL)
- Returns: Array of conversations with participants and last message

**GET** `/conversations/:id`
- Get specific conversation details
- Returns: Conversation with full participant list

**POST** `/conversations`
- Create new conversation
```json
{
  "type": "DIRECT",
  "name": "Project Discussion",
  "participantIds": ["user-id-1", "user-id-2"]
}
```

**PUT** `/conversations/:id`
- Update conversation details (admin only)
```json
{
  "name": "Updated Name",
  "description": "New description",
  "isArchived": false
}
```

**POST** `/conversations/:id/participants`
- Add participants to conversation (admin only)
```json
{
  "participantIds": ["user-id-3", "user-id-4"]
}
```

**DELETE** `/conversations/:id/participants/:participantId`
- Remove participant from conversation

**PUT** `/conversations/:conversationId/read`
- Mark conversation as read

#### **Messages**

**GET** `/conversations/:conversationId/messages`
- Get messages in a conversation
- Query params: `page`, `limit`, `before` (timestamp)
- Returns: Paginated messages with reactions and read receipts

**POST** `/conversations/:conversationId/messages`
- Send a new message
```json
{
  "content": "Hello team!",
  "type": "TEXT",
  "attachments": [],
  "mentionedUserIds": ["user-id"],
  "replyToId": "message-id"
}
```

**PUT** `/messages/:messageId`
- Edit message (sender only)
```json
{
  "content": "Updated message content"
}
```

**DELETE** `/messages/:messageId`
- Delete message (soft delete, sender only)

**POST** `/messages/:messageId/reactions`
- Add emoji reaction
```json
{
  "emoji": "👍"
}
```

**DELETE** `/messages/:messageId/reactions`
- Remove emoji reaction
```json
{
  "emoji": "👍"
}
```

**PUT** `/messages/:messageId/read`
- Mark specific message as read

#### **Announcements**

**GET** `/announcements`
- Get all active announcements
- Query params: `page`, `limit`, `active` (boolean)
- Returns: Paginated announcements with read status

**GET** `/announcements/:id`
- Get specific announcement

**POST** `/announcements`
- Create new announcement
```json
{
  "title": "System Maintenance",
  "content": "System will be down for maintenance...",
  "priority": "HIGH",
  "targetType": "ALL",
  "targetIds": null,
  "isPinned": true,
  "expiresAt": "2026-02-10T00:00:00Z",
  "attachments": []
}
```

**PUT** `/announcements/:id`
- Update announcement (creator only)

**DELETE** `/announcements/:id`
- Delete announcement (creator only)

**PUT** `/announcements/:id/read`
- Mark announcement as read

#### **Channels**

**GET** `/channels`
- Get all accessible channels
- Query params: `type` (PUBLIC | PRIVATE), `archived` (boolean)
- Returns: Channels with member count

**GET** `/channels/:id`
- Get channel details

**POST** `/channels`
- Create new channel
```json
{
  "name": "general",
  "description": "General discussion",
  "type": "PUBLIC",
  "departmentId": null,
  "projectId": null
}
```

**PUT** `/channels/:id`
- Update channel (admin only)

**POST** `/channels/:id/join`
- Join public channel

**POST** `/channels/:id/leave`
- Leave channel

#### **Email Templates**

**GET** `/email-templates`
- Get all email templates
- Query params: `active` (boolean)

**POST** `/email-templates`
- Create email template
```json
{
  "name": "Welcome Email",
  "code": "WELCOME_EMAIL",
  "subject": "Welcome to {{companyName}}",
  "body": "<html>Welcome {{userName}}!</html>",
  "variables": ["companyName", "userName"]
}
```

**PUT** `/email-templates/:id`
- Update email template (non-system templates only)

**POST** `/emails/send`
- Send email
```json
{
  "to": "user@example.com",
  "cc": "cc@example.com",
  "subject": "Subject",
  "body": "<html>Email body</html>",
  "templateId": "template-id"
}
```

**GET** `/email-logs`
- Get email sending history
- Query params: `page`, `limit`, `status`

#### **Search**

**GET** `/search/messages`
- Search messages across all conversations
- Query params: `q` (search query)
- Returns: Matching messages with conversation context

---

## Frontend Integration

### Pages

Three main pages have been created:

1. **MessagingPage** (`/pages/communication/MessagingPage.jsx`)
   - Split-pane interface with conversation list and message thread
   - Real-time message updates (when WebSocket implemented)
   - Message reactions and read receipts
   - Direct and group conversations

2. **AnnouncementsPage** (`/pages/communication/AnnouncementsPage.jsx`)
   - Announcement board with priority indicators
   - Pin important announcements
   - Track read status
   - Create/edit/delete announcements

3. **ChannelsPage** (`/pages/communication/ChannelsPage.jsx`)
   - Browse public and private channels
   - Join/leave channels
   - Create new channels
   - Channel member management

### API Client

All API calls are abstracted in `/api/communication.js`:

```javascript
import {
  getConversations,
  sendMessage,
  getAnnouncements,
  createAnnouncement,
  getChannels,
  joinChannel
} from '../../api/communication';
```

### Adding to Navigation

Add the communication module to your main navigation:

```javascript
// In your main App.jsx or routes configuration
import MessagingPage from './pages/communication/MessagingPage';
import AnnouncementsPage from './pages/communication/AnnouncementsPage';
import ChannelsPage from './pages/communication/ChannelsPage';

// Add routes
<Route path="/communication/messages" element={<MessagingPage />} />
<Route path="/communication/announcements" element={<AnnouncementsPage />} />
<Route path="/communication/channels" element={<ChannelsPage />} />
```

---

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_communication_module
npx prisma generate
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

---

## Real-Time Features (Optional Enhancement)

For real-time messaging, integrate Socket.IO:

### Backend Setup

1. Install Socket.IO:
```bash
npm install socket.io
```

2. Add WebSocket server (in `server.js`):
```javascript
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
  });
  
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Emit new messages to conversation room
io.to(`conversation-${conversationId}`).emit('new-message', message);
```

### Frontend Setup

1. Install Socket.IO client:
```bash
npm install socket.io-client
```

2. Connect in MessagingPage:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

useEffect(() => {
  if (selectedConversation) {
    socket.emit('join-conversation', selectedConversation.id);
    
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
  }
  
  return () => {
    if (selectedConversation) {
      socket.emit('leave-conversation', selectedConversation.id);
    }
  };
}, [selectedConversation]);
```

---

## Features Summary

### ✅ Implemented Features

1. **Messaging**
   - Direct and group conversations
   - Message history with pagination
   - Message editing and deletion
   - Emoji reactions
   - Read receipts
   - User mentions (data structure ready)
   - Message replies (data structure ready)

2. **Announcements**
   - Create/edit/delete announcements
   - Priority levels (Low, Normal, High, Urgent)
   - Target audience selection
   - Pin important announcements
   - Expiration dates
   - Read tracking
   - Rich text content support

3. **Team Channels**
   - Public and private channels
   - Channel creation and management
   - Join/leave functionality
   - Department and project associations
   - Member management

4. **Email Integration**
   - Email template management
   - Variable substitution support
   - Email sending functionality
   - Email history and status tracking

### 🔄 Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for instant messaging
   - Online presence indicators
   - Typing indicators

2. **File Sharing**
   - File uploads in messages
   - Image preview
   - Document sharing

3. **Advanced Search**
   - Full-text search across all messages
   - Filter by date, sender, conversation
   - Search in announcements

4. **Notifications**
   - Push notifications for new messages
   - Email notifications for announcements
   - Desktop notifications

5. **Video/Audio**
   - Voice messages
   - Video calls (WebRTC integration)

---

## Troubleshooting

### Common Issues

**1. Messages not loading**
- Check JWT token is valid
- Verify user is participant in conversation
- Check backend console for errors

**2. Cannot create conversation**
- Ensure participantIds are valid user IDs
- Check user has authentication token
- Verify backend service is running

**3. Announcements not showing**
- Check if announcement is active
- Verify expiration date hasn't passed
- Check targetType and targetIds match user

**4. Database migration errors**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run `npx prisma migrate reset` if needed (WARNING: deletes all data)

---

## API Testing

Use these sample requests to test the API:

### Create Conversation
```bash
curl -X POST http://localhost:5000/api/communication/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "GROUP",
    "name": "Team Discussion",
    "participantIds": ["user-id-1", "user-id-2"]
  }'
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/communication/conversations/CONV_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello team!",
    "type": "TEXT"
  }'
```

### Create Announcement
```bash
curl -X POST http://localhost:5000/api/communication/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Update",
    "content": "Please read this announcement",
    "priority": "HIGH",
    "targetType": "ALL"
  }'
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own conversations and company announcements
3. **Data Validation**: Input validation on all endpoints
4. **SQL Injection**: Prisma ORM prevents SQL injection
5. **XSS Prevention**: Sanitize user input on frontend
6. **Rate Limiting**: Consider adding rate limiting for message sending

---

## Performance Optimization

1. **Pagination**: Messages and announcements are paginated
2. **Indexing**: Database indexes on frequently queried fields
3. **Caching**: Consider Redis for conversation lists and online users
4. **Lazy Loading**: Messages load on demand
5. **Optimistic Updates**: UI updates immediately, syncs with server

---

## Support

For issues or questions:
1. Check this documentation first
2. Review backend logs
3. Check browser console for frontend errors
4. Verify database schema is up to date

---

**Module Version**: 1.0.0  
**Last Updated**: February 2, 2026  
**Status**: Production Ready ✅
