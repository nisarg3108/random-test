# Invoice System - Complete Guide

## Overview

The invoice system automatically generates professional PDF invoices and sends them via email when subscription payments are successfully processed. This guide explains the complete invoice workflow, features, and testing procedures.

## Features

### ✅ Automated Invoice Generation
- Automatic PDF invoice generation when payment succeeds
- Professional invoice format with company branding
- Unique invoice numbers for each payment
- Detailed payment breakdown

### ✅ Email Delivery
- Automatic email sending after successful payment
- Beautiful HTML email template
- PDF invoice attached to email
- Payment confirmation details included

### ✅ Manual Operations
- Download any invoice as PDF
- Resend invoice emails on demand
- View invoice preview in dashboard
- Export payment history

## Invoice Format

### Invoice PDF Includes:
1. **Header Section**
   - Company name and details
   - Invoice number
   - Invoice date
   - Payment status

2. **Bill To Section**
   - Tenant/Customer name
   - Tenant email

3. **Line Items**
   - Subscription plan name
   - Billing cycle
   - Unit price
   - Total amount

4. **Summary Section**
   - Subtotal
   - Tax (if applicable)
   - Grand total

5. **Payment Information**
   - Payment method (Stripe/Razorpay/Manual)
   - Payment date
   - Transaction ID

6. **Footer**
   - Thank you message
   - Support contact information

## API Endpoints

### 1. Get All Invoices
```http
GET /api/billing/invoices
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment_id",
      "invoiceNumber": "INV-12345678",
      "amount": 99.00,
      "currency": "USD",
      "status": "SUCCEEDED",
      "createdAt": "2026-02-18T10:00:00.000Z",
      "subscription": {
        "plan": {
          "name": "Professional Plan",
          "billingCycle": "MONTHLY"
        }
      }
    }
  ]
}
```

### 2. Get Single Invoice
```http
GET /api/billing/invoices/:paymentId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment_id",
    "invoiceNumber": "INV-12345678",
    "date": "2026-02-18T10:00:00.000Z",
    "status": "SUCCEEDED",
    "currency": "USD",
    "amount": 99.00,
    "tenant": {
      "name": "Acme Corp",
      "email": "billing@acme.com"
    },
    "items": [
      {
        "description": "Professional Plan - MONTHLY Subscription",
        "quantity": 1,
        "unitPrice": 99.00,
        "amount": 99.00
      }
    ]
  }
}
```

### 3. Download Invoice PDF
```http
GET /api/billing/invoices/:paymentId/download
Authorization: Bearer {token}
```

**Response:** PDF file download

### 4. Preview Invoice
```http
GET /api/billing/invoices/:paymentId/preview
Authorization: Bearer {token}
```

**Response:** Formatted invoice data (same as Get Single Invoice)

### 5. Resend Invoice Email
```http
POST /api/billing/invoices/:paymentId/resend
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice email sent successfully",
  "messageId": "email_message_id"
}
```

## Frontend Integration

### Invoice Tab in Billing Dashboard

The billing dashboard now includes an "Invoices & Receipts" tab that displays:

- List of all successful payments with invoices
- Invoice number and date
- Payment amount and status
- Download button for PDF
- Email button to resend invoice

### Usage Example:
```jsx
// Download invoice
window.open(`/api/billing/invoices/${payment.id}/download`, '_blank');

// Resend invoice email
const response = await fetch(`/api/billing/invoices/${payment.id}/resend`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## Email Configuration

### Required Environment Variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=billing@yourcompany.com
FRONTEND_URL=http://localhost:5173
```

### For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

### For Other Email Services:
- Update `SMTP_HOST` and `SMTP_PORT` accordingly
- Check provider documentation for SMTP settings

## Automatic Invoice Sending

### Stripe Webhooks
When Stripe sends an `invoice.payment_succeeded` event:
1. Payment record is created with status "SUCCEEDED"
2. Invoice number is auto-generated
3. PDF invoice is generated
4. Email is sent to tenant with PDF attachment
5. Console logs confirmation

### Razorpay Webhooks
When Razorpay sends a `payment.authorized` or `payment.captured` event:
1. Payment record is created with status "SUCCEEDED"
2. Invoice number is auto-generated
3. PDF invoice is generated
4. Email is sent to tenant with PDF attachment
5. Console logs confirmation

### Error Handling
- If email configuration is missing, invoice is still created but email is skipped
- If tenant email is missing, invoice is created but email is skipped
- Email errors don't fail the payment webhook
- All errors are logged to console

## Testing the Invoice System

### Test 1: View Existing Invoices
1. Login as admin
2. Navigate to **Subscription → Billing**
3. Click on **Invoices & Receipts** tab
4. Should see list of all successful payments

### Test 2: Download Invoice PDF
1. In the Invoices tab, click **Download** button
2. PDF should download with format: `invoice-INV-XXXXXXXX.pdf`
3. Open PDF and verify:
   - Company details shown
   - Invoice number and date correct
   - Customer details shown
   - Line items with subscription details
   - Payment amount correct
   - Payment method and transaction ID shown

### Test 3: Resend Invoice Email
1. Configure SMTP settings in `.env`
2. In Invoices tab, click **Email** button
3. Check inbox for email
4. Verify email contains:
   - Professional HTML layout
   - Invoice details
   - PDF attachment
   - Link to dashboard

### Test 4: Automatic Invoice on New Payment

#### For Stripe:
```bash
# Use Stripe CLI to trigger test webhook
stripe trigger invoice.payment_succeeded
```

#### For Razorpay:
```bash
# Make a test payment through Razorpay
# Or use webhook test endpoint:
POST /api/billing/webhooks/razorpay/test
```

### Test 5: API Endpoints

#### Get All Invoices:
```bash
curl -X GET http://localhost:3000/api/billing/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Download Invoice:
```bash
curl -X GET http://localhost:3000/api/billing/invoices/PAYMENT_ID/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf
```

#### Resend Email:
```bash
curl -X POST http://localhost:3000/api/billing/invoices/PAYMENT_ID/resend \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Customization

### Customize Invoice Template

Edit `backend/src/modules/subscription/invoice.service.js`:

1. **Change Company Details** (lines ~20-30):
```javascript
doc.text('Your Company Name', 50, 80)
   .text('Address Line 1', 50, 95)
   .text('City, State ZIP', 50, 110)
   .text('Email: billing@yourcompany.com', 50, 125)
```

2. **Change Colors** (search for color codes):
- `#1e40af` - Primary blue color
- `#6b7280` - Gray text color
- `#1f2937` - Dark text color

3. **Add Tax Calculation**:
```javascript
const taxRate = 0.1; // 10% tax
const tax = payment.amount * taxRate;
const total = payment.amount + tax;
```

4. **Add Company Logo**:
```javascript
// Add at the top of PDF generation
doc.image('path/to/logo.png', 50, 50, { width: 100 });
```

### Customize Email Template

Edit the email HTML in `invoice.service.js` (lines ~180-280):

1. **Change Email Colors**: Update CSS in `<style>` tag
2. **Modify Email Content**: Update HTML in `<body>` section
3. **Add Company Branding**: Update header section
4. **Change Button Styling**: Modify `.button` class

## Troubleshooting

### Issue: Invoices Not Showing
**Solution:** 
- Check that payments have status "SUCCEEDED"
- Verify user has correct tenant access
- Check browser console for errors

### Issue: PDF Download Not Working
**Solution:**
- Check backend logs for errors
- Verify pdfkit is installed: `npm list pdfkit`
- Ensure payment exists with correct tenant

### Issue: Email Not Sending
**Solution:**
- Verify SMTP configuration in `.env`
- Check SMTP credentials are correct
- Test with: `node -e "require('./src/services/email.service.js').testConnection()"`
- Check spam folder

### Issue: Email Sent But No PDF Attachment
**Solution:**
- Check backend logs for PDF generation errors
- Verify payment has all required fields
- Check file size limits on email provider

### Issue: Invoice Number Duplicates
**Solution:**
- Invoice numbers use timestamp + tenantId
- If concerned about duplicates, use UUID:
```javascript
import { v4 as uuidv4 } from 'uuid';
invoiceNumber: `INV-${uuidv4().slice(0, 8).toUpperCase()}`
```

## Database Schema

### SubscriptionPayment Model
```prisma
model SubscriptionPayment {
  id                String        @id @default(cuid())
  subscriptionId    String
  tenantId          String
  amount            Float
  currency          String
  status            String        // SUCCEEDED, FAILED, PENDING
  invoiceNumber     String?       // Auto-generated
  description       String?
  providerPaymentId String?
  succeededAt       DateTime?
  failedAt          DateTime?
  createdAt         DateTime      @default(now())
  
  subscription      Subscription  @relation(fields: [subscriptionId])
  tenant            Tenant        @relation(fields: [tenantId])
}
```

## Security Considerations

1. **Authentication Required**: All invoice endpoints require valid JWT token
2. **Tenant Isolation**: Users can only access their own tenant's invoices
3. **Payment Verification**: Webhooks verify signatures before processing
4. **Email Security**: Uses secure SMTP connection
5. **PDF Generation**: Server-side only, no client access to raw data

## Future Enhancements

### Potential Features:
- [ ] Add tax calculation support
- [ ] Multi-currency support
- [ ] Custom invoice templates per tenant
- [ ] Invoice numbering customization
- [ ] Bulk invoice download
- [ ] Invoice dispute/refund handling
- [ ] Payment receipt vs invoice distinction
- [ ] Credit notes for refunds
- [ ] Multiple payment line items
- [ ] Installment payments support

## Support

For issues or questions:
1. Check backend logs: `npm run dev` in backend folder
2. Check frontend console for errors
3. Verify SMTP configuration
4. Test with Stripe/Razorpay test webhooks
5. Review database records for payment data

## Summary

The invoice system provides:
- ✅ Automatic PDF generation
- ✅ Professional invoice format
- ✅ Email delivery with attachments
- ✅ Manual download capability
- ✅ Resend functionality
- ✅ Complete audit trail
- ✅ Webhook integration
- ✅ Frontend dashboard integration

All invoices are automatically generated and emailed when payments succeed, with full manual override capabilities for customer service needs.
