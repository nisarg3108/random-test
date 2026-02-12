# Email Queue and Health Check System

## Overview
The Email Queue system provides reliable, asynchronous email delivery with automatic retry logic, monitoring capabilities, and health checks. This system ensures that emails are not lost and can be retried in case of failures.

## Features

### 1. Email Queue Processing
- **Asynchronous Processing**: Emails are queued and processed in the background
- **Priority Levels**: Support for priority-based email sending (1-10, where 1 is highest)
- **Automatic Retry**: Failed emails are automatically retried with exponential backoff
- **Scheduled Sending**: Support for scheduling emails to be sent at a specific time
- **Status Tracking**: Track email status through the entire lifecycle

### 2. Email Queue Statuses
- **PENDING**: Email is queued and waiting to be sent
- **PROCESSING**: Email is currently being sent
- **SENT**: Email was successfully sent
- **FAILED**: Email failed after max retry attempts
- **CANCELLED**: Email was manually cancelled

### 3. Retry Logic
- **Max Attempts**: Default 3 attempts per email
- **Exponential Backoff**: Retry delays increase exponentially (2^attempts minutes)
  - 1st retry: 2 minutes after failure
  - 2nd retry: 4 minutes after failure
  - 3rd retry: 8 minutes after failure
- **Error Logging**: Detailed error logs for each attempt

### 4. Health Check
- SMTP connection verification
- Configuration status check
- Detailed error reporting
- Helpful diagnostics information

## Database Schema

### EmailQueue Model
```prisma
model EmailQueue {
  id          String   @id @default(uuid())
  tenantId    String
  
  to          String
  cc          String?
  bcc         String?
  subject     String
  body        String   @db.Text
  
  templateId  String?
  variables   Json?
  
  status      String   @default("PENDING")
  priority    Int      @default(5)
  
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  
  scheduledAt DateTime @default(now())
  processingAt DateTime?
  sentAt      DateTime?
  failedAt    DateTime?
  cancelledAt DateTime?
  
  lastError   String?  @db.Text
  errorLog    Json?
  
  metadata    Json?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId, status])
  @@index([status, scheduledAt])
  @@index([priority, scheduledAt])
  @@index([createdAt])
}
```

## API Endpoints

### 1. Health Check
**GET** `/api/communication/email/health`

Check SMTP connection health and configuration status.

**Response:**
```json
{
  "healthy": true,
  "configured": true,
  "message": "SMTP connection healthy",
  "details": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "your-email@gmail.com",
    "secure": false
  }
}
```

**Status Codes:**
- `200`: SMTP is healthy and working
- `503`: SMTP is configured but connection failed
- `500`: Health check failed

### 2. Queue Email
**POST** `/api/communication/email/queue`

Add an email to the queue for sending.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Email Subject",
  "body": "<h1>HTML Email Body</h1>",
  "templateId": "optional-template-id",
  "variables": {
    "name": "John Doe"
  },
  "priority": 5,
  "scheduledAt": "2024-02-15T10:00:00Z"
}
```

**Response:**
```json
{
  "id": "queue-email-id",
  "tenantId": "tenant-id",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "status": "PENDING",
  "priority": 5,
  "scheduledAt": "2024-02-15T10:00:00Z",
  "attempts": 0,
  "maxAttempts": 3,
  "createdAt": "2024-02-15T09:45:00Z"
}
```

### 3. Get Queue Statistics
**GET** `/api/communication/email/queue/stats`

Get statistics about the email queue for the current tenant.

**Response:**
```json
{
  "pending": 15,
  "processing": 2,
  "sent": 1234,
  "failed": 8,
  "cancelled": 3,
  "total": 1262,
  "successRate": "97.78"
}
```

### 4. Get Queued Emails
**GET** `/api/communication/email/queue`

Get list of queued emails with optional filters.

**Query Parameters:**
- `status`: Filter by status (PENDING, PROCESSING, SENT, FAILED, CANCELLED)
- `priority`: Filter by priority (1-10)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "emails": [
    {
      "id": "email-id",
      "to": "recipient@example.com",
      "subject": "Email Subject",
      "status": "PENDING",
      "priority": 5,
      "attempts": 1,
      "maxAttempts": 3,
      "scheduledAt": "2024-02-15T10:00:00Z",
      "lastError": "Connection timeout",
      "createdAt": "2024-02-15T09:45:00Z"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

### 5. Retry Failed Emails
**POST** `/api/communication/email/queue/retry-failed`

Retry all failed emails that haven't exceeded max attempts.

**Response:**
```json
{
  "message": "Failed emails queued for retry"
}
```

### 6. Retry Specific Email
**POST** `/api/communication/email/queue/:emailId/retry`

Retry a specific failed or pending email immediately.

**Response:**
```json
{
  "message": "Email queued for retry"
}
```

### 7. Cancel Email
**POST** `/api/communication/email/queue/:emailId/cancel`

Cancel a pending or processing email.

**Response:**
```json
{
  "message": "Email cancelled"
}
```

**Note:** Cannot cancel emails that have already been sent.

## Service Methods

### EmailQueueService

#### queueEmail(options)
Queue an email for sending.

```javascript
const queuedEmail = await emailQueueService.queueEmail({
  tenantId: 'tenant-123',
  to: 'recipient@example.com',
  subject: 'Welcome',
  body: '<h1>Welcome!</h1>',
  priority: 5,
  scheduledAt: new Date()
});
```

#### processQueue()
Process pending emails in the queue. Called automatically every 30 seconds.

#### getStats(tenantId)
Get queue statistics for a tenant.

```javascript
const stats = await emailQueueService.getStats('tenant-123');
// Returns: { pending, processing, sent, failed, cancelled, total, successRate }
```

#### getQueuedEmails(options)
Get queued emails with filters.

```javascript
const result = await emailQueueService.getQueuedEmails({
  tenantId: 'tenant-123',
  status: 'PENDING',
  priority: 5,
  limit: 50,
  offset: 0
});
```

#### retryEmail(emailId)
Retry a specific email immediately.

```javascript
await emailQueueService.retryEmail('email-123');
```

#### cancelEmail(emailId)
Cancel a queued email.

```javascript
await emailQueueService.cancelEmail('email-123');
```

#### checkHealth()
Check SMTP health and configuration.

```javascript
const health = await emailQueueService.checkHealth();
// Returns: { healthy, configured, message, details }
```

#### cleanup(daysToKeep)
Clean up old sent/failed emails.

```javascript
const deletedCount = await emailQueueService.cleanup(30);
// Removes emails older than 30 days
```

## Background Processing

The email queue processor runs automatically every 30 seconds and:

1. **Finds Pending Emails**: Queries for emails with status "PENDING" that are scheduled to be sent
2. **Processes in Batches**: Processes up to 10 emails at a time
3. **Priority Order**: Processes higher priority emails first
4. **Updates Status**: Marks emails as "PROCESSING" while sending
5. **Handles Errors**: Catches errors and updates status to "FAILED" if max attempts reached
6. **Logs Results**: Creates EmailLog entries for successful sends and final failures

## Error Handling

### Error Log Structure
Each failed attempt is logged in the `errorLog` field:

```json
[
  {
    "attempt": 1,
    "error": "Connection timeout",
    "timestamp": "2024-02-15T10:05:00Z"
  },
  {
    "attempt": 2,
    "error": "SMTP server unavailable",
    "timestamp": "2024-02-15T10:07:00Z"
  }
]
```

### Retry Strategy
1. **Immediate Failure**: Email status set to "PENDING" for retry
2. **Exponential Backoff**: Schedule next attempt with increasing delay
3. **Max Attempts Reached**: Mark as "FAILED" and create EmailLog entry
4. **Manual Retry**: Admins can manually retry failed emails

## Monitoring

### Queue Health Monitoring
Monitor these metrics to ensure queue health:

- **Pending Count**: Number of emails waiting to be sent
- **Processing Count**: Number of emails currently being sent
- **Failed Count**: Number of emails that failed after max attempts
- **Success Rate**: Percentage of successfully sent emails

### Alerts
Consider setting up alerts for:
- High pending count (> 100)
- High failed rate (> 5%)
- SMTP connection failures
- Long processing times

## SMTP Configuration

The email queue requires SMTP to be configured in the `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an app password
3. Use app password in SMTP_PASS

## Best Practices

### 1. Priority Usage
- **Priority 1-3**: Critical emails (password resets, security alerts)
- **Priority 4-6**: Normal emails (notifications, updates)
- **Priority 7-10**: Low priority (newsletters, bulk emails)

### 2. Scheduled Sending
Use scheduled sending for:
- Time zone optimization
- Business hours delivery
- Batch processing of bulk emails

### 3. Monitoring
- Check queue stats regularly
- Monitor failed email count
- Review error logs for patterns
- Set up health check alerts

### 4. Cleanup
Run cleanup regularly to remove old emails:
```javascript
// Clean up emails older than 30 days
await emailQueueService.cleanup(30);
```

Consider running this as a scheduled job:
```javascript
// In scheduler.js
cron.schedule('0 2 * * *', async () => { // Run at 2 AM daily
  await emailQueueService.cleanup(30);
});
```

### 5. Error Handling
- Review failed emails regularly
- Investigate error patterns
- Consider increasing max attempts for critical emails
- Set up email notifications for persistent failures

## Integration Examples

### 1. Queue Email from Service
```javascript
import emailQueueService from './services/emailQueue.service.js';

// In your service
async function sendWelcomeEmail(user) {
  await emailQueueService.queueEmail({
    tenantId: user.tenantId,
    to: user.email,
    subject: 'Welcome to Our Platform',
    body: `<h1>Welcome ${user.name}!</h1>`,
    priority: 3, // High priority
    metadata: { userId: user.id, type: 'welcome' }
  });
}
```

### 2. Send Bulk Emails
```javascript
async function sendBulkAnnouncement(users, announcement) {
  for (const user of users) {
    await emailQueueService.queueEmail({
      tenantId: announcement.tenantId,
      to: user.email,
      subject: announcement.subject,
      body: announcement.body,
      priority: 7, // Low priority for bulk
      metadata: { 
        announcementId: announcement.id,
        userId: user.id 
      }
    });
  }
}
```

### 3. Schedule Reminder
```javascript
async function scheduleReminder(user, task) {
  const reminderDate = new Date(task.dueDate);
  reminderDate.setHours(reminderDate.getHours() - 24); // 24h before
  
  await emailQueueService.queueEmail({
    tenantId: user.tenantId,
    to: user.email,
    subject: `Reminder: ${task.title}`,
    body: `<p>${task.title} is due in 24 hours</p>`,
    priority: 5,
    scheduledAt: reminderDate,
    metadata: { taskId: task.id }
  });
}
```

## Frontend Integration

### 1. Check Email Health
```javascript
import axios from 'axios';

async function checkEmailHealth() {
  try {
    const response = await axios.get('/api/communication/email/health');
    return response.data;
  } catch (error) {
    console.error('Email health check failed:', error);
    throw error;
  }
}
```

### 2. Display Queue Stats
```javascript
async function getQueueStats() {
  const response = await axios.get('/api/communication/email/queue/stats');
  return response.data;
}

// In your component
const stats = await getQueueStats();
console.log(`Success rate: ${stats.successRate}%`);
console.log(`Pending emails: ${stats.pending}`);
console.log(`Failed emails: ${stats.failed}`);
```

### 3. Admin Dashboard
```javascript
// Get failed emails for admin review
async function getFailedEmails() {
  const response = await axios.get('/api/communication/email/queue', {
    params: { status: 'FAILED', limit: 100 }
  });
  return response.data.emails;
}

// Retry specific email
async function retryEmail(emailId) {
  await axios.post(`/api/communication/email/queue/${emailId}/retry`);
}

// Cancel email
async function cancelEmail(emailId) {
  await axios.post(`/api/communication/email/queue/${emailId}/cancel`);
}
```

## Troubleshooting

### Issue: Emails Not Being Sent

**Check:**
1. SMTP configuration in `.env`
2. Email queue service is initialized (`emailQueueService.initialize()`)
3. Check queue stats for pending/processing emails
4. Review email health check endpoint

**Solution:**
```javascript
// Check health
const health = await emailQueueService.checkHealth();
console.log(health);

// Check queue stats
const stats = await emailQueueService.getStats();
console.log(stats);

// Manually trigger queue processing
await emailQueueService.processQueue();
```

### Issue: High Failed Rate

**Check:**
1. SMTP credentials are correct
2. Email server is accessible
3. Review error logs in failed emails

**Solution:**
```javascript
// Get failed emails with error details
const failed = await emailQueueService.getQueuedEmails({
  status: 'FAILED',
  limit: 50
});

// Review error patterns
failed.emails.forEach(email => {
  console.log(`To: ${email.to}`);
  console.log(`Error: ${email.lastError}`);
  console.log(`Attempts: ${email.attempts}`);
  console.log('---');
});

// Retry all failed emails
await emailQueueService.retryFailedEmails();
```

### Issue: Queue Growing Too Large

**Check:**
1. Processing interval (default 30 seconds)
2. Batch size (default 10 emails per cycle)
3. SMTP server rate limits

**Solution:**
```javascript
// Increase batch size in emailQueue.service.js
const pendingEmails = await prisma.emailQueue.findMany({
  // ... filters ...
  take: 20 // Increase from 10 to 20
});

// Or reduce processing interval
// In emailQueue.service.js constructor:
this.processingInterval = cron.schedule('*/15 * * * * *', 
  // Process every 15 seconds instead of 30
);
```

## Security Considerations

1. **Tenant Isolation**: All emails are scoped to tenant
2. **Authentication**: All endpoints require authentication
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **SMTP Credentials**: Store securely in environment variables
5. **Email Content**: Sanitize user input before queueing
6. **Access Control**: Restrict admin endpoints to authorized users

## Performance Optimization

1. **Batch Processing**: Process multiple emails in parallel
2. **Index Optimization**: Database indexes on status and scheduledAt
3. **Cleanup**: Regular cleanup of old emails
4. **Monitoring**: Track processing times and throughput
5. **Scaling**: Consider separate queue workers for high volume

## Future Enhancements

1. **Multiple Queue Workers**: Support for distributed processing
2. **Advanced Scheduling**: Cron-like scheduling for recurring emails
3. **Email Templates**: Enhanced template variable substitution
4. **Delivery Reports**: Track email opens and clicks
5. **Webhook Support**: Notify external systems of email status
6. **Cloud Storage**: Attachment support with cloud storage
7. **Email Preview**: Preview emails before sending
8. **A/B Testing**: Support for email content testing

## Summary

The Email Queue system provides:
- ✅ Reliable asynchronous email delivery
- ✅ Automatic retry with exponential backoff
- ✅ Priority-based processing
- ✅ Scheduled sending
- ✅ Health check and monitoring
- ✅ Admin controls for retry/cancel
- ✅ Detailed error logging
- ✅ Queue statistics and metrics

This ensures that emails are never lost and can be reliably delivered even in the face of temporary failures or SMTP issues.
