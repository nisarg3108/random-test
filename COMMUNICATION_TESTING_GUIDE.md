# Communication Module - Testing Guide

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npx prisma migrate dev
npm start
```

### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Application
```
http://localhost:5173
```

---

## API Testing (Postman / cURL)

### Authentication
All requests need a JWT token. Get it from:
1. Login at `http://localhost:5173`
2. Check browser DevTools → Application → localStorage → `token`
3. Copy token and use in Authorization header

### Test Endpoints

#### Create Conversation
```bash
curl -X POST http://localhost:5000/api/communication/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": ["USER_ID_1", "USER_ID_2"],
    "name": "Test Chat"
  }'
```

#### Send Message
```bash
curl -X POST http://localhost:5000/api/communication/conversations/CONV_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, testing!",
    "type": "TEXT"
  }'
```

#### Get Messages
```bash
curl -X GET "http://localhost:5000/api/communication/conversations/CONV_ID/messages?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Announcement
```bash
curl -X POST http://localhost:5000/api/communication/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "content": "This is a test announcement",
    "priority": "NORMAL",
    "targetType": "ALL"
  }'
```

#### Set Typing Status
```bash
curl -X POST http://localhost:5000/api/communication/conversations/CONV_ID/typing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isTyping": true}'
```

#### Get Online Users
```bash
curl -X GET http://localhost:5000/api/communication/online-users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## WebSocket Testing

### Test with Browser Console

#### 1. Connect to WebSocket
```javascript
// Open DevTools Console and paste:
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

ws.onopen = () => console.log('✓ Connected');
ws.onmessage = (e) => console.log('📨 Event:', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = () => console.log('❌ Disconnected');
```

#### 2. Send Test Message (From Browser)
Open `/messaging` page, select a conversation, and type a message.

**Expected WebSocket Events:**
```
{type: 'typing:start', payload: {conversationId, userId, isTyping: true}}
{type: 'message:new', payload: {id, content, conversationId, senderId, createdAt}}
{type: 'typing:stop', payload: {conversationId, userId, isTyping: false}}
```

#### 3. Test Typing Indicator
Open two browser windows:
1. **Window A**: Go to `/messaging`, select conversation
2. **Window B**: Open DevTools Console, connect WebSocket (see #1)
3. **In Window A**: Start typing in message input

**Expected in Window B:**
```javascript
{type: 'typing:start', payload: {...}}
// After 2 seconds of inactivity:
{type: 'typing:stop', payload: {...}}
```

#### 4. Test Online Presence
```javascript
// In DevTools Console:
const token = localStorage.getItem('token');
fetch(`http://localhost:5000/api/communication/online-users`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.table(data));
```

**Expected Response:**
```javascript
[
  {userId: "uuid", username: "john_doe", lastSeen: "2024-02-02T..."},
  {userId: "uuid", username: "jane_smith", lastSeen: "2024-02-02T..."}
]
```

#### 5. Test Announcements
```javascript
// Publish announcement from Announcements page
// Check WebSocket for event:
{type: 'announcement:new', payload: {id, title, content, priority, ...}}
```

---

## Frontend Component Testing

### Messaging Page (`/messaging`)

#### Test Cases:
1. **Load Conversations**
   - [ ] Page loads with list of conversations
   - [ ] Each conversation shows last message preview
   - [ ] Online status indicator appears for active users

2. **Send Message**
   - [ ] Type in message input
   - [ ] Press Enter or click Send button
   - [ ] Message appears immediately in chat
   - [ ] Message input clears
   - [ ] Conversation moves to top

3. **Typing Indicator**
   - [ ] Open two browser windows (same conversation)
   - [ ] Type in Window A
   - [ ] "Someone is typing..." appears in Window B
   - [ ] Indicator disappears after 2 seconds of inactivity
   - [ ] Multiple typers show "3 people are typing..."

4. **Message Updates**
   - [ ] Edit message (if available)
   - [ ] Update appears instantly in other windows
   - [ ] Delete message
   - [ ] Message disappears from all windows

5. **Reactions**
   - [ ] Add emoji reaction to message
   - [ ] Reaction appears instantly for others
   - [ ] Remove reaction
   - [ ] Reaction disappears for all

6. **Message History**
   - [ ] Scroll up to load older messages
   - [ ] Load more button works
   - [ ] Timestamp displays correctly

#### Browser Console Checks:
```javascript
// Check if WebSocket is connected
console.log(ws.readyState); // 1 = OPEN, 0 = CONNECTING, 2 = CLOSING, 3 = CLOSED

// Check state after sending message
// Open React DevTools → Components → MessagingPage
// Check state variables: messages, typingUsers, onlineUsers
```

### Announcements Page (`/announcements`)

#### Test Cases:
1. **Load Announcements**
   - [ ] Page loads with list of announcements
   - [ ] Pinned announcements appear at top
   - [ ] Priority badges show correct colors
   - [ ] Read count displays

2. **Create Announcement**
   - [ ] Click "New Announcement" button
   - [ ] Fill in title, content, priority
   - [ ] Click Create
   - [ ] Announcement appears at top of list instantly

3. **Real-Time Notification**
   - [ ] Open announcements page in two windows
   - [ ] Create announcement in Window A
   - [ ] Snackbar notification appears in Window B
   - [ ] New announcement appears in list immediately

4. **Filter & Sort**
   - [ ] View active announcements
   - [ ] View archived announcements
   - [ ] Pinned items sort correctly

### Channels Page (`/channels`)

#### Test Cases:
1. **Load Channels**
   - [ ] Page loads with list of channels
   - [ ] Channel member count shows
   - [ ] Privacy indicator (public/private) displays

2. **Create Channel**
   - [ ] Create new channel
   - [ ] Channel appears in list immediately
   - [ ] Can assign members

3. **Join/Leave**
   - [ ] Join public channel
   - [ ] Leave channel
   - [ ] Update reflects immediately

---

## End-to-End Testing

### Scenario 1: Real-Time Messaging
**Setup:** 2 users, 1 conversation

1. **User A**: Open `/messaging` → Select conversation
2. **User B**: Open `/messaging` → Same conversation
3. **User A**: Type message → Press Send
4. **Verify**: Message appears instantly in User B's window
5. **User B**: Send response
6. **Verify**: Message appears instantly in User A's window

### Scenario 2: Typing Indicators
**Setup:** 2 users, 1 conversation

1. **User A**: Open messaging
2. **User B**: Open messaging (same conversation) + DevTools Console
3. **User A**: Start typing
4. **Verify (User B Console)**:
   - `typing:start` event received
   - Message input shows "Someone is typing..."
5. **User A**: Stop typing (wait 2 seconds)
6. **Verify (User B Console)**:
   - `typing:stop` event received
   - "Someone is typing..." disappears

### Scenario 3: Announcements Broadcast
**Setup:** 2 users, announcements page open

1. **User A**: Go to `/announcements`
2. **User B**: Go to `/announcements`
3. **User A**: Click "New Announcement"
4. **User A**: Fill in title, content, priority HIGH
5. **User A**: Click Create
6. **Verify (User A)**: Announcement appears in list
7. **Verify (User B)**: 
   - Snackbar: "New announcement received!"
   - Announcement appears at top of list
   - Can see immediately without refresh

### Scenario 4: Online Presence
**Setup:** Multiple users

1. **User A**: Open application
2. **User A**: Go to `/messaging` or `/channels`
3. **Verify**: See online indicator (green dot) next to active users
4. **User A**: Close browser
5. **Verify (User B)**: User A shows as offline after ~30 seconds

### Scenario 5: Message Reactions
**Setup:** 2 users, conversation with messages

1. **User A**: Open conversation, hover over message
2. **User A**: Click emoji reaction button → Select emoji
3. **Verify (User A)**: Emoji appears under message
4. **Verify (User B)**: Reaction appears instantly without refresh
5. **User B**: Click same emoji to add reaction
6. **Verify**: Count increments for that emoji

---

## Database Testing

### Check Database State

#### Using Prisma Studio
```bash
cd backend
npx prisma studio
```

Navigate to:
- **Conversation** table - check conversation records
- **Message** table - verify messages have correct content, createdAt, updatedAt
- **Announcement** table - check announcement records
- **ChatChannel** table - verify channels
- **ConversationParticipant** table - check conversation members

#### Using Raw SQL (if needed)
```bash
# Connect to database
psql -U postgres -d erp_system

# View tables
SELECT * FROM "Conversation";
SELECT * FROM "Message" ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "Announcement" ORDER BY "createdAt" DESC;
SELECT * FROM "ChatChannel";
```

---

## Performance Testing

### Load Testing

#### Test Message Sending Speed
1. Open `/messaging`
2. Select conversation
3. Use Chrome DevTools → Network tab
4. Send message
5. Check response time (should be < 200ms)

#### Test WebSocket Latency
```javascript
// In DevTools Console
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

ws.onopen = () => {
  const start = Date.now();
  ws.send(JSON.stringify({type: 'test'}));
};

ws.onmessage = (e) => {
  const latency = Date.now() - start;
  console.log(`WebSocket latency: ${latency}ms`);
};
```

#### Test Multiple Simultaneous Messages
1. Open 3 browser windows with same conversation
2. In each window, send 5 messages rapidly
3. Verify all messages appear in all windows
4. Check database for message count (should be 15)

---

## Error Handling Testing

### Test Cases:

1. **WebSocket Disconnect**
   - [ ] Pull network cable / disable internet
   - [ ] Check if application handles gracefully
   - [ ] Verify reconnection attempts on reconnect
   - [ ] Check console for error messages

2. **Invalid Token**
   ```bash
   curl -X POST http://localhost:5000/api/communication/conversations \
     -H "Authorization: Bearer INVALID_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"participantIds": ["user1"]}'
   ```
   - [ ] Returns 401 Unauthorized
   - [ ] Frontend redirects to login

3. **Conversation Not Found**
   ```bash
   curl -X POST http://localhost:5000/api/communication/conversations/INVALID_ID/messages \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "test"}'
   ```
   - [ ] Returns 404 error
   - [ ] Frontend shows error message

4. **Empty Message Content**
   - [ ] Try to send empty message
   - [ ] Send button should be disabled
   - [ ] Message should not be sent

5. **Non-existent User in Participants**
   - [ ] Try to create conversation with invalid user IDs
   - [ ] Should return validation error

---

## Testing Checklist

### Before Deployment
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] WebSocket connects successfully
- [ ] Typing indicators update in real-time
- [ ] Messages sync across multiple windows
- [ ] Announcements broadcast to all users
- [ ] Online presence shows/updates correctly
- [ ] Error messages display properly
- [ ] No console errors or warnings
- [ ] Database migrations run successfully
- [ ] Response times are acceptable (< 500ms)
- [ ] WebSocket reconnects on disconnect
- [ ] Multi-user scenarios work correctly
- [ ] Mobile responsive design works

---

## Common Issues & Fixes

### WebSocket Connection Fails
**Problem**: `WebSocket is closed before the connection is established`

**Solutions**:
```javascript
// 1. Check token is valid
console.log(localStorage.getItem('token'));

// 2. Check backend is running
// 3. Check CORS settings in backend/src/app.js
// 4. Check WebSocket server is initialized
```

### Messages Not Appearing in Real-Time
**Problem**: Messages appear after page refresh but not real-time

**Solutions**:
- [ ] Check WebSocket connection is open
- [ ] Check browser DevTools Network tab for WebSocket messages
- [ ] Verify `useMessagingWebSocket()` hook is being called
- [ ] Check if message is being deduplicated (already exists in state)

### Typing Indicator Not Showing
**Problem**: "Someone is typing..." doesn't appear

**Solutions**:
- [ ] Check `handleTyping` is being called on input change
- [ ] Verify `setTypingStatus()` API call succeeds
- [ ] Check `typingUsers` state updates in React DevTools
- [ ] Verify WebSocket receives `typing:start` event

### Announcements Not Broadcasting
**Problem**: New announcements don't appear in other user windows

**Solutions**:
- [ ] Check `useAnnouncementsWebSocket()` hook is mounted
- [ ] Verify WebSocket receives `announcement:new` event
- [ ] Check `newAnnouncement` state updates
- [ ] Verify Snackbar component renders

---

## Test Data

### Create Test Users (SQL)
```sql
-- In your database
INSERT INTO "User" (id, email, username, tenantId, createdAt, updatedAt) VALUES
  ('user1', 'alice@example.com', 'alice', 'tenant1', NOW(), NOW()),
  ('user2', 'bob@example.com', 'bob', 'tenant1', NOW(), NOW()),
  ('user3', 'charlie@example.com', 'charlie', 'tenant1', NOW(), NOW());
```

### Quick Test Messages (SQL)
```sql
INSERT INTO "Message" (id, content, conversationId, senderId, type, createdAt, updatedAt) VALUES
  (gen_random_uuid(), 'Hello!', 'CONV_ID', 'user1', 'TEXT', NOW(), NOW()),
  (gen_random_uuid(), 'Hi there!', 'CONV_ID', 'user2', 'TEXT', NOW(), NOW()),
  (gen_random_uuid(), 'How are you?', 'CONV_ID', 'user1', 'TEXT', NOW(), NOW());
```

---

## Debug Mode

### Enable Detailed Logging
```javascript
// In frontend/src/hooks/useWebSocket.js (temporarily)
const useWebSocket = () => {
  // Add console.logs
  console.log('[WebSocket] Connection:', { url, token: token?.substring(0, 10) + '...' });
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('[WebSocket] Received:', data);  // Log all events
  };
};

// In backend/src/core/realtime.js
console.log('[RealTime] Broadcasting to participants:', participantIds);
console.log('[RealTime] Event:', type, payload);
```

### Browser DevTools
1. **Network Tab**: Monitor API calls and WebSocket frames
2. **Application Tab**: Check localStorage for token and cache
3. **React DevTools**: Inspect component state and props
4. **Console**: Watch for errors and debug logs

---

## Continuous Testing

### Automated Tests (Optional)
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests (with Cypress/Playwright)
npm run test:e2e
```

---

## Support

For issues or questions, check:
1. Browser console for errors
2. Backend logs (`npm start`)
3. Network tab for failed requests
4. Database state in Prisma Studio
5. [COMMUNICATION_REALTIME.md](./COMMUNICATION_REALTIME.md) for architecture overview
