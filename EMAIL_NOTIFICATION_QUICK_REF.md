 # Email Notifications Quick Reference

## ⚡ Quick Setup (3 Minutes)

### 1. Add to `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@company.com
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail App Password:
1. Google Account → Security → 2-Step Verification (enable)
2. Security → App passwords → Create
3. Copy 16-char password → Use as `SMTP_PASS`

### 3. Restart server:
```bash
cd backend && npm start
```

## 🧪 Quick Test

### Browser Console (Easiest):
```javascript
// Copy/paste entire browser-test-email-notifications.js file
// OR use this one-liner:
fetch('http://localhost:5000/api/allocations/mark-overdue', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d));
```

### Create Test Overdue:
```javascript
fetch('http://localhost:5000/api/allocations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    assetId: 'asset-uuid',
    employeeId: 'employee-uuid',
    allocatedDate: '2024-01-01',
    expectedReturnDate: '2024-01-10',  // Past date
    purpose: 'Test email'
  })
}).then(r => r.json()).then(d => console.log(d));
```

## 📊 What Was Added

### Backend Changes:
1. **email.service.js** - 2 new methods:
   - `sendOverdueAllocationNotification(data)`
   - `sendBatchOverdueNotifications(allocations)`

2. **scheduler.js** - Email integration:
   - Sends emails after marking overdue
   - Logs results: X sent, Y failed
   - Graceful error handling

### Files Created:
- `EMAIL_NOTIFICATION_GUIDE.md` - Full documentation
- `EMAIL_NOTIFICATION_IMPLEMENTATION.md` - Implementation summary
- `test-email-notifications.js` - Node.js test
- `browser-test-email-notifications.js` - Browser test

## 🔄 How It Works

**Daily at Midnight (00:00)**:
1. Finds ACTIVE allocations past expectedReturnDate
2. Updates status to OVERDUE
3. Sends email to each employee
4. Logs results

**Email Contains**:
- ⚠️ Red warning header
- Asset details (name, code, dates)
- Days overdue (prominent)
- "View My Allocations" button
- Employee name and allocation ID

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No emails sent | Check `.env` has SMTP settings, restart server |
| Auth error | Use App Password, not regular password |
| Goes to spam | Mark "Not Spam" (dev mode ok, use SendGrid for prod) |
| Timeout | Check firewall, try port 465 |
| No overdue found | Create test with past expectedReturnDate |

## 📝 Quick Commands

```bash
# Test immediately (backend must be stopped)
node test-email-notifications.js

# Check logs
tail -f backend/logs/app.log

# Verify SMTP
node -e "import('./backend/src/services/email.service.js').then(m => new m.default().verifyConnection().then(console.log))"
```

## 🎯 Success Checklist

- [ ] SMTP vars in `.env`
- [ ] Server restarted
- [ ] Test shows "X sent, 0 failed"
- [ ] Email received in inbox
- [ ] Link opens allocations page
- [ ] Displays correctly on mobile

## 📖 Full Docs

- **Complete Guide**: `EMAIL_NOTIFICATION_GUIDE.md`
- **Implementation**: `EMAIL_NOTIFICATION_IMPLEMENTATION.md`
- **Overdue System**: `OVERDUE_ALLOCATION_TESTING_GUIDE.md`

## 🔗 Other Providers

**Outlook**:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

**SendGrid** (Production):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx...
```

**AWS SES**:
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
```

---

**Status**: ✅ Ready  
**Version**: 1.0
