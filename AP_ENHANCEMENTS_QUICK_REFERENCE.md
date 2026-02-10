# AP Module Enhancements - Quick Reference Card

## 🚀 New Features Overview

### 1. 📎 Attachment Uploads

**Upload Bill Attachment:**
```bash
POST /api/ap/bills/:id/attachments
Content-Type: multipart/form-data
Body: file=<file>

# Example with curl
curl -X POST http://localhost:5000/api/ap/bills/BILL_ID/attachments \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@invoice.pdf"
```

**Delete Bill Attachment:**
```bash
DELETE /api/ap/bills/:id/attachments/:attachmentId
```

**Upload Payment Attachment:**
```bash
POST /api/ap/payments/:id/attachments
DELETE /api/ap/payments/:id/attachments/:attachmentId
```

**View Attachment:**
```
http://localhost:5000/uploads/ap-attachments/<filename>
```

**Limits:**
- Max size: 5MB
- Formats: PDF, JPG, PNG, JPEG, DOC, DOCX, XLS, XLSX

---

### 2. 📊 Excel Export

**Export Aging Report:**
```bash
GET /api/ap/aging/export?asOfDate=2026-02-10

# Example with curl
curl -X GET "http://localhost:5000/api/ap/aging/export" \
  -H "Authorization: Bearer TOKEN" \
  --output aging-report.xlsx
```

**Frontend (React):**
```jsx
const handleExport = async () => {
  const response = await fetch(`${API_BASE_URL}/api/ap/aging/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aging-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
};
```

**Excel Contents:**
- Summary sheet: Aging buckets, amounts, counts
- Details sheet: All bills with vendor info, amounts, days overdue

---

### 3. 📧 Email Notifications

**Configuration (.env):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Gmail App Password:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character password in `SMTP_PASS`

**Email Types:**
1. **Overdue Bills** - Scheduled daily at 9:00 AM
2. **Bill Approvals** - Sent when bill is approved
3. **Payment Confirmations** - Sent when payment is processed

**Enable Scheduled Jobs:**
Add to `backend/src/server.js`:
```javascript
import { scheduleOverdueBillNotifications } from './jobs/ap-notifications.job.js';

// After app.listen()
scheuleOverdueBillNotifications();
```

**Manual Trigger (Testing):**
```javascript
import { triggerOverdueBillNotifications } from './jobs/ap-notifications.job.js';
await triggerOverdueBillNotifications();
```

**Send Approval Email:**
```javascript
import { sendBillApprovalNotification } from './config/email.js';

await sendBillApprovalNotification(
  bill,
  vendor,
  approver,
  ['recipient@example.com']
);
```

**Send Payment Confirmation:**
```javascript
import { sendPaymentConfirmation } from './config/email.js';

await sendPaymentConfirmation(
  payment,
  vendor,
  bills,
  ['accounting@example.com']
);
```

---

### 4. 📄 Pagination

**List Bills with Pagination:**
```bash
GET /api/ap/bills?page=1&limit=50&status=PENDING

# Example with curl
curl "http://localhost:5000/api/ap/bills?page=1&limit=50" \
  -H "Authorization: Bearer TOKEN"
```

**Response Structure:**
```json
{
  "data": [
    { "id": "xxx", "billNumber": "BILL-000001", ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 237,
    "totalPages": 5
  }
}
```

**List Payments with Pagination:**
```bash
GET /api/ap/payments?page=2&limit=25&vendorId=xxx
```

**Frontend (React):**
```jsx
const [bills, setBills] = useState([]);
const [pagination, setPagination] = useState({});

const fetchBills = async (page = 1) => {
  const response = await fetch(
    `${API_BASE_URL}/api/ap/bills?page=${page}&limit=50`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const result = await response.json();
  setBills(result.data);
  setPagination(result.pagination);
};

// Pagination controls
<button onClick={() => fetchBills(pagination.page - 1)}>Previous</button>
<span>Page {pagination.page} of {pagination.totalPages}</span>
<button onClick={() => fetchBills(pagination.page + 1)}>Next</button>
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 50) - Items per page
- Works with all existing filters (status, vendorId, etc.)

---

## 🔧 Configuration Files

### Upload Configuration
**File:** `backend/src/config/upload.js`
```javascript
// Adjust file size limit
limits: { fileSize: 10 * 1024 * 1024 } // 10MB

// Change allowed file types
const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|csv/;

// Change upload directory
const uploadsDir = path.join(__dirname, '../../uploads/ap-attachments');
```

### Email Configuration
**File:** `backend/src/config/email.js`
```javascript
// Customize email templates
const mailOptions = {
  from: `"Your Company" <${process.env.SMTP_USER}>`,
  to: recipients.join(', '),
  subject: 'Custom Subject',
  html: 'Your HTML template here'
};
```

### Cron Job Schedule
**File:** `backend/src/jobs/ap-notifications.job.js`
```javascript
// Change schedule (cron format)
cron.schedule('0 9 * * *', sendOverdueBillNotifications); // 9:00 AM daily
cron.schedule('0 0 * * *', sendOverdueBillNotifications); // Midnight daily
cron.schedule('0 * * * *', sendOverdueBillNotifications); // Every hour
cron.schedule('*/15 * * * *', sendOverdueBillNotifications); // Every 15 min

// Change timezone
{ timezone: "America/New_York" }
{ timezone: "Europe/London" }
{ timezone: "Asia/Kolkata" }
```

---

## 📁 File Locations

### Backend Files
```
backend/
├── src/
│   ├── config/
│   │   ├── upload.js                 # Multer file upload config
│   │   └── email.js                  # Nodemailer email config
│   ├── modules/ap/
│   │   ├── ap.service.js             # Updated with enhancements
│   │   ├── ap.controller.js          # New controllers added
│   │   └── ap.routes.js              # New routes added
│   ├── jobs/
│   │   └── ap-notifications.job.js   # Cron job scheduler
│   ├── app.js                        # Static file serving added
│   └── server.js                     # Enable cron jobs here
├── uploads/
│   └── ap-attachments/               # Upload directory (auto-created)
└── .env.example                      # SMTP config already documented
```

### Documentation Files
```
AP_ENHANCEMENTS_GUIDE.md              # Comprehensive guide (4500+ lines)
AP_ENHANCEMENTS_SUMMARY.md            # Implementation summary
AP_ENHANCEMENTS_QUICK_REFERENCE.md    # This file
AP_IMPLEMENTATION.md                  # Core module spec
AP_TESTING_REPORT.md                  # Testing analysis
AP_QUICK_TEST_GUIDE.md                # Test scenarios
```

---

## 🧪 Testing Commands

### Test File Upload
```bash
# Create test PDF
echo "Test Invoice" > test-invoice.pdf

# Upload to bill
curl -X POST http://localhost:5000/api/ap/bills/BILL_ID/attachments \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test-invoice.pdf"

# Verify in uploads directory
ls backend/uploads/ap-attachments/
```

### Test Excel Export
```bash
# Export via API
curl -X GET "http://localhost:5000/api/ap/aging/export" \
  -H "Authorization: Bearer TOKEN" \
  --output test-export.xlsx

# Open in Excel/LibreOffice to verify
```

### Test Pagination
```bash
# Page 1
curl "http://localhost:5000/api/ap/bills?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN" | jq '.pagination'

# Page 2
curl "http://localhost:5000/api/ap/bills?page=2&limit=10" \
  -H "Authorization: Bearer TOKEN" | jq '.pagination'
```

### Test Email (Manual)
```bash
# Add to server.js temporarily:
import { triggerOverdueBillNotifications } from './jobs/ap-notifications.job.js';
await triggerOverdueBillNotifications();

# Check email inbox
# Check server console for logs
```

---

## 🐛 Troubleshooting

### Attachment Upload Issues

**Error: "No file uploaded"**
```javascript
// Frontend must use FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/ap/bills/ID/attachments', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData // Don't set Content-Type header
});
```

**Error: "File too large"**
```javascript
// Increase limit in upload.js
limits: { fileSize: 10 * 1024 * 1024 } // Change to 10MB
```

**Error: "File type not allowed"**
```javascript
// Add to allowedTypes regex in upload.js
const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|csv|txt/;
```

### Email Issues

**Error: "Email not configured"**
```bash
# Add to .env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Restart server
```

**Error: "Authentication failed"**
```bash
# Gmail users: Use App Password, not regular password
# 1. Enable 2FA
# 2. Generate App Password
# 3. Use 16-character password in SMTP_PASS
```

**Emails not received**
```bash
# 1. Check spam folder
# 2. Verify SMTP_USER is correct
# 3. Check server logs for errors
# 4. Test with manual trigger
```

### Excel Export Issues

**Error: "Cannot read property 'summary' of undefined"**
```bash
# No bills found for aging report
# Create test bills in the system first
```

**Download fails in browser**
```javascript
// Check CORS settings
// Verify authentication token is valid
// Check browser console for errors
```

### Pagination Issues

**Empty results on page 2**
```bash
# Verify total count
curl "http://localhost:5000/api/ap/bills?page=1&limit=10" | jq '.pagination.total'

# If total < 11, page 2 will be empty (expected)
```

**Slow performance**
```sql
-- Add database indexes
CREATE INDEX idx_apbill_tenantid_billdate ON "APBill" ("tenantId", "billDate");
CREATE INDEX idx_payment_tenantid_paymentdate ON "Payment" ("tenantId", "paymentDate");
```

---

## 📊 Performance Tips

### Database Optimization
```sql
-- Add indexes for faster queries
CREATE INDEX idx_apbill_status ON "APBill" ("status");
CREATE INDEX idx_apbill_duedate ON "APBill" ("dueDate");
CREATE INDEX idx_apbill_vendorid ON "APBill" ("vendorId");
CREATE INDEX idx_payment_vendorid ON "Payment" ("vendorId");
```

### File Upload Optimization
```javascript
// Use S3 for production (planned Phase 3)
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: 'your-bucket',
    key: (req, file, cb) => cb(null, `ap/${Date.now()}-${file.originalname}`)
  })
});
```

### Email Optimization
```javascript
// Use queue for large batches (planned Phase 3)
import Queue from 'bull';
const emailQueue = new Queue('email');

emailQueue.process(async (job) => {
  await sendEmail(job.data);
});

// Add to queue instead of sending directly
await emailQueue.add({ bill, vendor, recipients });
```

---

## ✅ Deployment Checklist

- [ ] Configure SMTP in `.env`
- [ ] Create uploads directory: `mkdir -p backend/uploads/ap-attachments`
- [ ] Set directory permissions: `chmod 755 backend/uploads`
- [ ] Test file upload
- [ ] Test Excel export
- [ ] Enable cron jobs in `server.js`
- [ ] Test email sending (manual trigger)
- [ ] Update frontend UI
- [ ] Monitor server logs
- [ ] Announce features to users

---

## 📞 Support

**Documentation:**
- Full guide: [AP_ENHANCEMENTS_GUIDE.md](./AP_ENHANCEMENTS_GUIDE.md)
- Summary: [AP_ENHANCEMENTS_SUMMARY.md](./AP_ENHANCEMENTS_SUMMARY.md)
- Core spec: [AP_IMPLEMENTATION.md](./AP_IMPLEMENTATION.md)

**Created:** February 10, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready
