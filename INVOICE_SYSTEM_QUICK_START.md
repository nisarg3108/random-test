# Invoice System - Quick Start

## What's New

✅ **Professional PDF Invoices** - Automatically generated for every successful payment
✅ **Email Delivery** - Invoices sent via email with PDF attachment
✅ **Download Capability** - Download invoices anytime from dashboard
✅ **Manual Resend** - Resend invoice emails on demand

## Setup (One-Time)

### 1. Configure Email in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=billing@yourcompany.com
```

### 2. Restart Backend:
```bash
cd backend
npm run dev
```

## How It Works

### Automatic Flow:
1. Customer makes payment (Stripe/Razorpay)
2. Webhook received by backend
3. Payment marked as SUCCEEDED
4. **PDF invoice auto-generated**
5. **Email sent with PDF attachment**
6. Customer receives invoice instantly

### Manual Operations:
- **View Invoices**: Go to Subscription → Billing → Invoices tab
- **Download PDF**: Click "Download" button
- **Resend Email**: Click "Email" button

## Quick Test

### Test Invoice Email:
```bash
# 1. Make sure SMTP is configured in .env
# 2. Find a payment ID from your database
# 3. Run:
curl -X POST http://localhost:3000/api/billing/invoices/PAYMENT_ID/resend \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test PDF Download:
1. Login to dashboard
2. Go to **Subscription → Billing**
3. Click **Invoices & Receipts** tab
4. Click **Download** on any invoice
5. PDF opens/downloads

## Customization

### Change Company Info:
Edit `backend/src/modules/subscription/invoice.service.js` (lines 20-30):
```javascript
doc.text('Your Company Name', 50, 80)
   .text('Your Address', 50, 95)
   .text('City, State ZIP', 50, 110)
   .text('Email: billing@company.com', 50, 125)
```

### Change Colors:
Search for color codes in `invoice.service.js`:
- `#1e40af` → Your brand color
- Update CSS in email template

## API Endpoints

```http
GET    /api/billing/invoices                      # List all invoices
GET    /api/billing/invoices/:id                  # Get invoice details
GET    /api/billing/invoices/:id/download         # Download PDF
POST   /api/billing/invoices/:id/resend           # Resend email
```

## Troubleshooting

**Email not sending?**
- Check SMTP credentials in `.env`
- Test with Gmail App Password
- Check spam folder

**PDF not generating?**
- Check backend logs
- Verify pdfkit installed: `npm list pdfkit`

**Invoices not showing?**
- Check payment status is "SUCCEEDED"
- Verify correct tenant access

## Features Checklist

- [x] PDF invoice generation
- [x] Email with attachment
- [x] Download from dashboard
- [x] Resend capability
- [x] Professional format
- [x] Auto invoice number
- [x] Payment details
- [x] Company branding
- [x] Transaction ID
- [x] Beautiful emails

## Next Steps

1. ✅ Configure SMTP settings
2. ✅ Customize company details in invoice template
3. ✅ Update email template branding
4. ✅ Test with a payment
5. ✅ Verify email received
6. ✅ Check PDF format

📄 **Full Documentation**: See `INVOICE_SYSTEM_GUIDE.md`

## Support

- Backend logs: Check console when backend runs
- Test payments: Use Stripe/Razorpay test mode
- Email test: Send to your own email first

---

**That's it!** Your invoice system is ready to use. Every successful payment now automatically generates and emails a professional PDF invoice.
