# Email Queue Quick Setup & Testing Guide

## What Was Implemented

### 1. Database Changes
- **New Model**: `EmailQueue` - manages queued emails with retry logic
- **Migration**: Successfully created and applied

### 2. Backend Services
- **emailQueue.service.js**: Complete email queue service with:
  - Automatic processing every 30 seconds
  - Priority-based sending (1-10)
  - Automatic retry with exponential backoff
  - Health check capabilities
  - Queue statistics and monitoring

### 3. API Endpoints (7 new)
- `GET /api/communication/email/health` - SMTP health check
- `GET /api/communication/email/queue/stats` - Queue statistics
- `GET /api/communication/email/queue` - List queued emails
- `POST /api/communication/email/queue` - Queue an email
- `POST /api/communication/email/queue/retry-failed` - Retry all failed emails
- `POST /api/communication/email/queue/:emailId/retry` - Retry specific email
- `POST /api/communication/email/queue/:emailId/cancel` - Cancel email

## Setup Instructions

### 1. SMTP Configuration (Already Done)
Your `.env` file is already configured with Gmail SMTP:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=testbro378@gmail.com
SMTP_PASS=mhhv brag vdan nurq
SMTP_FROM=noreply@yourcompany.com
```

### 2. Database Migration (Already Applied)
The EmailQueue model has been added to the database.

### 3. Server Initialization (Already Set Up)
The email queue processor is automatically initialized when the server starts.

## Testing

### Option 1: Run Automated Test Suite
```bash
cd backend
node test-email-queue.js
```

This will test:
- SMTP health check
- Queuing emails with different priorities
- Scheduling emails
- Queue statistics
- Retrying failed emails
- Viewing queued emails

### Option 2: Manual Testing with Postman/Insomnia

#### 1. Login First
```
POST http://localhost:5000/api/auth/login
Body:
{
  "email": "admin@demo.com",
  "password": "Admin@123"
}
```
Save the returned token for Authorization header.

#### 2. Check SMTP Health
```
GET http://localhost:5000/api/communication/email/health
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Expected Response (if healthy):**
```json
{
  "healthy": true,
  "configured": true,
  "message": "SMTP connection healthy",
  "details": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "testbro378@gmail.com",
    "secure": false
  }
}
```

#### 3. Queue an Email
```
POST http://localhost:5000/api/communication/email/queue
Headers:
  Authorization: Bearer YOUR_TOKEN
Body:
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "body": "<h1>Hello</h1><p>This is a test email.</p>",
  "priority": 5
}
```

**Expected Response:**
```json
{
  "id": "some-uuid",
  "tenantId": "your-tenant-id",
  "to": "recipient@example.com",
  "subject": "Test Email",
  "status": "PENDING",
  "priority": 5,
  "attempts": 0,
  "maxAttempts": 3,
  "scheduledAt": "2024-02-15T10:00:00Z",
  "createdAt": "2024-02-15T09:55:00Z"
}
```

#### 4. Check Queue Statistics
```
GET http://localhost:5000/api/communication/email/queue/stats
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "pending": 5,
  "processing": 0,
  "sent": 120,
  "failed": 2,
  "cancelled": 1,
  "total": 128,
  "successRate": "93.75"
}
```

#### 5. View Queued Emails
```
GET http://localhost:5000/api/communication/email/queue?status=PENDING&limit=10
Headers:
  Authorization: Bearer YOUR_TOKEN
```

#### 6. Retry Failed Emails
```
POST http://localhost:5000/api/communication/email/queue/retry-failed
Headers:
  Authorization: Bearer YOUR_TOKEN
```

## How It Works

### 1. Email Processing Flow
```
Queue Email → PENDING → PROCESSING → SENT
                ↓                      ↑
              FAILED ← (retry with backoff)
```

### 2. Automatic Processing
- Runs every 30 seconds automatically
- Processes up to 10 emails per cycle
- Prioritizes urgent emails (priority 1-3)
- Applies exponential backoff on failures

### 3. Retry Logic
- **1st attempt fails**: Retry in 2 minutes (2^1)
- **2nd attempt fails**: Retry in 4 minutes (2^2)
- **3rd attempt fails**: Mark as FAILED (2^3)

### 4. Status Lifecycle
- **PENDING**: Waiting to be sent
- **PROCESSING**: Currently being sent
- **SENT**: Successfully sent (logged in EmailLog)
- **FAILED**: Failed after 3 attempts (logged in EmailLog)
- **CANCELLED**: Manually cancelled by admin

## Monitoring

### Check Server Logs
When the server starts, you should see:
```
✅ Email queue processor initialized
```

When emails are processed, you'll see:
```
📬 Processing 5 queued emails
📧 Email queued: abc-123 to user@example.com
✅ Email sent successfully: abc-123
```

Or on failure:
```
❌ Error sending email abc-123: Connection timeout
🔄 Retrying failed email: abc-123 (attempt 2)
```

### Queue Statistics Dashboard (Future)
You can build a frontend dashboard that displays:
- Pending emails count
- Success rate
- Failed emails list
- Recent activity

## Integration with Existing Features

### 1. Announcement System
When creating announcements, emails are now queued:
```javascript
// In communication.service.js
await emailQueueService.queueEmail({
  tenantId,
  to: recipient.email,
  subject: announcement.title,
  body: announcement.content,
  priority: announcement.priority || 5
});
```

### 2. Notifications
All notification emails go through the queue:
- Welcome emails
- Password reset
- Task reminders
- Approval notifications

## Troubleshooting

### Issue: Emails stuck in PENDING
**Check:**
1. Is the server running?
2. Is the email queue initialized?
3. Check server logs for errors

**Fix:**
```bash
# Restart the server
npm run dev
```

### Issue: All emails failing
**Check:**
1. SMTP credentials correct?
2. Gmail security settings (2FA, app password)?
3. Network connectivity?

**Test:**
```
GET http://localhost:5000/api/communication/email/health
```

### Issue: High priority emails not sent first
**Check:**
- Emails are ordered by priority (1 = highest)
- Processing happens every 30 seconds
- Verify `scheduledAt` is not in the future

## Benefits

✅ **Reliability**: Emails never lost, automatic retries
✅ **Performance**: Async processing, no blocking
✅ **Priority**: Urgent emails sent first
✅ **Monitoring**: Full visibility into email status
✅ **Scheduling**: Send emails at specific times
✅ **Health Check**: Verify SMTP configuration
✅ **Admin Control**: Retry or cancel emails manually
✅ **Error Tracking**: Detailed error logs per attempt

## Next Steps (Optional Enhancements)

1. **Frontend Dashboard**: Build admin UI for queue monitoring
2. **Email Templates**: Enhanced template system with variables
3. **Webhooks**: Notify external systems of email status
4. **Bulk Operations**: Send thousands of emails efficiently
5. **Cloud Storage**: Store email attachments in S3/Azure Blob
6. **Delivery Reports**: Track opens and clicks
7. **Email Preview**: Preview before sending
8. **A/B Testing**: Test email content variations

## Summary

You now have a production-ready email queue system with:
- ✅ SMTP health check endpoint
- ✅ Email queue with automatic processing
- ✅ Priority-based sending
- ✅ Automatic retry with exponential backoff
- ✅ Queue statistics and monitoring
- ✅ Admin controls (retry, cancel)
- ✅ Integration with existing communication module
- ✅ Complete documentation

The system is ready to use and will automatically process queued emails every 30 seconds!
