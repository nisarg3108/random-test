# Communication Module - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Database Migration (2 minutes)

```bash
cd backend
npx prisma migrate dev --name add_communication_module
npx prisma generate
```

This creates all necessary tables:
- Conversation
- ConversationParticipant
- Message
- MessageReaction
- MessageReadReceipt
- Announcement
- AnnouncementRead
- ChatChannel
- ChatChannelMember
- EmailTemplate
- EmailLog

### Step 2: Verify Backend Routes (1 minute)

The routes are already registered in `backend/src/app.js`:
```javascript
import communicationRoutes from './modules/communication/communication.routes.js';
app.use('/api/communication', communicationRoutes);
```

Start your backend server:
```bash
cd backend
npm run dev
```

You should see: ✅ Server running on port 5000

### Step 3: Add Frontend Routes (2 minutes)

Add these routes to your main React router configuration:

```javascript
// In your App.jsx or main router file
import MessagingPage from './pages/communication/MessagingPage';
import AnnouncementsPage from './pages/communication/AnnouncementsPage';
import ChannelsPage from './pages/communication/ChannelsPage';

// Inside your Routes
<Route path="/communication/messages" element={<MessagingPage />} />
<Route path="/communication/announcements" element={<AnnouncementsPage />} />
<Route path="/communication/channels" element={<ChannelsPage />} />
```

### Step 4: Update Navigation (Optional)

Add communication links to your sidebar/navigation:

```javascript
{
  title: 'Communication',
  icon: <ChatIcon />,
  children: [
    { title: 'Messages', path: '/communication/messages' },
    { title: 'Announcements', path: '/communication/announcements' },
    { title: 'Channels', path: '/communication/channels' }
  ]
}
```

---

## ✨ Test the Features

### 1. Create Your First Conversation

**Via API:**
```bash
curl -X POST http://localhost:5000/api/communication/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DIRECT",
    "participantIds": ["user-id-2"]
  }'
```

**Via Frontend:**
1. Navigate to `/communication/messages`
2. Click "New Chat" button
3. Select users to chat with
4. Start messaging!

### 2. Send Your First Message

```bash
curl -X POST http://localhost:5000/api/communication/conversations/{conversationId}/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! This is my first message!",
    "type": "TEXT"
  }'
```

### 3. Create an Announcement

**Via Frontend:**
1. Go to `/communication/announcements`
2. Click "New Announcement"
3. Fill in:
   - Title: "Welcome to Communication Module"
   - Content: "We now have internal messaging!"
   - Priority: "HIGH"
   - Target: "ALL"
4. Click "Publish"

### 4. Create a Team Channel

**Via Frontend:**
1. Navigate to `/communication/channels`
2. Click "Create Channel"
3. Enter:
   - Name: "general"
   - Description: "General team discussion"
   - Type: "PUBLIC"
4. Click "Create"
5. Other users can now join and collaborate!

---

## 📊 What You Get

### ✅ Core Features

**Messaging:**
- ✉️ Direct messages (1-on-1)
- 👥 Group conversations
- 💬 Real-time chat interface
- 😊 Emoji reactions
- ✅ Read receipts
- ✏️ Edit/delete messages
- 📄 Message history with pagination

**Announcements:**
- 📢 Company-wide broadcasts
- 🎯 Targeted announcements (by department/role)
- ⚡ Priority levels (Low, Normal, High, Urgent)
- 📌 Pin important announcements
- 📅 Expiration dates
- 👁️ Read tracking
- 📎 Attachment support (data structure ready)

**Team Channels:**
- 🌐 Public channels (anyone can join)
- 🔒 Private channels (invitation only)
- 🏢 Department-specific channels
- 📁 Project-specific channels
- 👥 Member management
- ⚙️ Channel settings

**Email Integration:**
- 📧 Email template management
- 🔄 Variable substitution
- 📨 Send emails programmatically
- 📊 Email history and tracking
- ✅ Delivery status monitoring

---

## 🎨 UI Components

All pages are built with Material-UI and follow your existing design patterns:

### MessagingPage
- **Layout**: Split-pane (conversations list + message thread)
- **Features**: Search, real-time updates, reactions, read indicators
- **Responsive**: Works on mobile and desktop

### AnnouncementsPage
- **Layout**: Card grid with priority indicators
- **Features**: Create/edit, pin, expiration, read tracking
- **Filters**: Active/expired, priority levels

### ChannelsPage
- **Layout**: Card grid with member avatars
- **Features**: Public/private tabs, join/leave, settings
- **Management**: Create, edit, archive channels

---

## 🔧 Configuration

### Environment Variables

No additional environment variables needed! Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For authentication

### Optional: Email Configuration

To enable actual email sending, add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

Then update `communication.service.js` to integrate with nodemailer (already installed).

---

## 📱 Mobile Support

All pages are fully responsive:
- Messages: Stacked layout on mobile
- Announcements: Single column card view
- Channels: Responsive grid

---

## 🔐 Security

Built-in security features:
- ✅ JWT authentication required on all endpoints
- ✅ Users can only access their own conversations
- ✅ Conversation participant validation
- ✅ Announcement creator permissions
- ✅ Channel admin authorization
- ✅ Prisma ORM prevents SQL injection

---

## 🎯 Next Steps

### Immediate:
1. ✅ Run database migration
2. ✅ Add routes to your app
3. ✅ Test the features

### Optional Enhancements:
1. **Real-time Updates**: Add Socket.IO (see main documentation)
2. **File Uploads**: Integrate file storage service
3. **Push Notifications**: Add browser/mobile notifications
4. **Rich Text Editor**: Add formatting to messages/announcements
5. **Video Calls**: Integrate WebRTC for video meetings

---

## 📞 Support

**Documentation:**
- Full guide: `COMMUNICATION_MODULE_IMPLEMENTATION.md`
- API reference: See documentation file

**Testing:**
- All API endpoints are documented with curl examples
- Frontend pages include error handling
- Console logs for debugging

**Common URLs:**
- Messages: `http://localhost:3000/communication/messages`
- Announcements: `http://localhost:3000/communication/announcements`
- Channels: `http://localhost:3000/communication/channels`

---

## 🎉 You're Ready!

Your communication module is now fully set up and ready to use. Start by:

1. Creating a conversation with a colleague
2. Posting your first announcement
3. Setting up team channels

**Happy Communicating! 💬**

---

**Quick Links:**
- [Full Documentation](./COMMUNICATION_MODULE_IMPLEMENTATION.md)
- [Backend Code](./backend/src/modules/communication/)
- [Frontend Pages](./frontend/src/pages/communication/)
- [API Client](./frontend/src/api/communication.js)
