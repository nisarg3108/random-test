# Email Notification System for Overdue Allocations

## Overview
The system automatically sends email notifications to employees when their asset allocations become overdue. This runs as a scheduled job every midnight and can also be triggered manually for testing.

## Features
- 🔔 Automated daily checks at midnight
- 📧 Professional HTML email templates
- ⚠️ Clear overdue warnings with days overdue
- 📊 Detailed asset and allocation information
- 🔄 Graceful degradation (works even if email fails)
- 📝 Comprehensive logging and error tracking

## Email Configuration

### Required Environment Variables
Add these to your `.env` file:

```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup Instructions

1. **Enable 2-Factor Authentication**
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - Turn it on

2. **Generate App Password**
   - Go to Google Account Settings
   - Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "ERP System"
   - Copy the 16-character password
   - Use this as `SMTP_PASS` in your `.env` file

3. **Update .env File**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # 16-character app password
   SMTP_FROM=noreply@yourcompany.com
   ```

### Other Email Providers

#### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

## Implementation Details

### Files Modified

1. **backend/src/services/email.service.js**
   - Added `sendOverdueAllocationNotification(allocationData)`
   - Added `sendBatchOverdueNotifications(allocations)`
   - Professional HTML email template with warning styling

2. **backend/src/core/scheduler.js**
   - Integrated email notifications into daily cron job
   - Added email sending to `runOverdueCheckNow()` for testing
   - Graceful error handling for email failures

### Email Template Features
- ⚠️ Red warning header
- 📋 Complete asset details table
- 📅 Days overdue prominently displayed
- 🔗 Direct link to allocations page
- 💡 Yellow info box with action reminder
- 📝 Allocation ID for reference

## Testing Email Notifications

### Method 1: Immediate Test (Recommended)

Create a test file `test-email-notifications.js`:

```javascript
import { runOverdueCheckNow } from './backend/src/core/scheduler.js';

console.log('Testing overdue allocation email notifications...\n');

runOverdueCheckNow()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
  });
```

Run with:
```bash
node test-email-notifications.js
```

### Method 2: Browser Console Test

```javascript
// Trigger immediate overdue check with email notifications
fetch('http://localhost:5000/api/allocations/mark-overdue', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(result => {
  console.log('Overdue Check Result:', result);
  console.log('✅ Check your email inbox!');
})
.catch(err => console.error('Error:', err));
```

### Method 3: Create Test Overdue Allocation

```javascript
// 1. Create an allocation with past expected return date
const testAllocation = {
  assetId: 'asset-uuid-here',
  employeeId: 'employee-uuid-here',
  allocatedDate: '2024-01-01',
  expectedReturnDate: '2024-01-10', // Past date
  purpose: 'Testing overdue notification'
};

fetch('http://localhost:5000/api/allocations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testAllocation)
})
.then(r => r.json())
.then(() => {
  // 2. Trigger overdue check
  return fetch('http://localhost:5000/api/allocations/mark-overdue', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
})
.then(r => r.json())
.then(result => {
  console.log('✅ Overdue notification sent!', result);
})
.catch(err => console.error('❌ Error:', err));
```

## Scheduled Job Behavior

### Daily Schedule
- **Time**: Runs at 00:00 (midnight) every day
- **Cron Pattern**: `'0 0 * * *'`
- **Process**:
  1. Scans all ACTIVE allocations
  2. Identifies those past their expectedReturnDate
  3. Marks them as OVERDUE in database
  4. Sends email notification to each affected employee
  5. Logs all results and any errors

### Log Output Example
```
🔍 Running scheduled job: Check overdue allocations
✅ Marked 3 allocation(s) as overdue
Overdue allocations: [...]
📧 Sending overdue notifications...
📧 Email notifications: 3 sent, 0 failed
```

### Error Handling
- Email configuration checked before sending
- Individual email failures logged but don't stop process
- Allocations marked as OVERDUE even if emails fail
- Detailed error logs for troubleshooting

## Troubleshooting

### Email Not Configured
```
⚠️  Email not configured. Skipping overdue notifications.
```
**Solution**: Add SMTP credentials to `.env` file

### Authentication Failed
```
❌ Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**: 
- For Gmail: Use App Password, not regular password
- Enable 2FA first, then generate App Password

### Connection Timeout
```
❌ Error: Connection timeout
```
**Solution**:
- Check firewall settings
- Verify SMTP_HOST and SMTP_PORT are correct
- Try port 465 with `secure: true` if 587 fails

### Emails Going to Spam
**Solutions**:
- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified "From" address
- Avoid spam trigger words in subject/body
- Use a dedicated email service (SendGrid, AWS SES)

### No Emails Received
**Checklist**:
1. ✅ SMTP credentials in `.env` file?
2. ✅ Employee has valid email in database?
3. ✅ Check spam/junk folder
4. ✅ Check server logs for email sending
5. ✅ Test with `runOverdueCheckNow()` function

## Email Content Preview

### Subject Line
```
⚠️ Overdue Asset Return Notice - [Asset Name]
```

### Email Body Structure
- **Header**: Red warning banner "⚠️ Asset Return Overdue"
- **Greeting**: Personalized with employee name
- **Alert**: Days overdue prominently displayed
- **Asset Details Table**:
  - Asset Name
  - Asset Code
  - Allocated Date
  - Expected Return Date
  - Days Overdue
  - Purpose (if provided)
- **Action Box**: Yellow warning with required action
- **CTA Button**: "View My Allocations" (links to frontend)
- **Footer**: Contact information and allocation ID

## API Endpoints

### Manual Trigger (for testing)
```
POST /api/allocations/mark-overdue
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "count": 3,
  "allocations": [...],
  "emailResults": {
    "sent": 3,
    "failed": 0,
    "errors": []
  }
}
```

## Monitoring & Maintenance

### Check Email Service Status
```javascript
import EmailService from './backend/src/services/email.service.js';

const emailService = new EmailService();
emailService.verifyConnection()
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

### View Scheduled Jobs
Server logs on startup:
```
✅ Scheduled jobs initialized
   - Overdue allocations: Daily at midnight (00:00)
```

### Monitor Email Delivery
Check server logs for:
- `Overdue allocation notification sent to [email]`
- `Email notifications: X sent, Y failed`
- Error messages for failed sends

## Best Practices

1. **Email Service Selection**
   - Use professional email service (SendGrid, AWS SES) for production
   - Gmail is fine for development/testing
   - Avoid using personal accounts for production

2. **Rate Limiting**
   - Most SMTP providers have daily limits
   - Gmail: 500 emails/day
   - Consider batching if you have many overdue allocations

3. **Email Content**
   - Keep subject lines clear and actionable
   - Include all relevant information in body
   - Provide direct link to resolution page
   - Include contact information for support

4. **Testing**
   - Always test emails in development first
   - Check spam filters
   - Test on multiple email clients
   - Verify links work correctly

5. **Monitoring**
   - Log all email sends
   - Track delivery failures
   - Monitor spam complaints
   - Keep bounce rates low

## Production Checklist

- [ ] SMTP credentials configured in production `.env`
- [ ] Email service verified and tested
- [ ] Frontend URL correctly set for email links
- [ ] Scheduled job confirmed running at midnight
- [ ] Test email received successfully
- [ ] Employee emails verified in database
- [ ] Spam folder checked (emails not marked as spam)
- [ ] Error logging and monitoring in place
- [ ] Email templates reviewed and approved
- [ ] Backup notification method considered (SMS, in-app)

## Next Steps

1. **Configure SMTP** in your `.env` file
2. **Test Immediately** using `runOverdueCheckNow()`
3. **Create Test Allocation** with past return date
4. **Verify Email** received with correct content
5. **Monitor Logs** for scheduled job execution
6. **Adjust Template** if needed for your organization

## Additional Features to Consider

- 📱 SMS notifications for critical overdue items
- 🔔 In-app notifications as backup
- 📊 Weekly digest emails for managers
- ⏰ Escalation emails after X days overdue
- 📈 Analytics on overdue rates
- 🎯 Reminder emails before due date (preventive)

---

**Documentation Version**: 1.0  
**Last Updated**: January 2025  
**Feature**: Overdue Allocation Email Notifications
