# Invoice Email Troubleshooting Guide

## Step 1: Test Email Configuration

First, let's verify your SMTP settings work:

```bash
cd backend
node test-email.js
```

**Expected output:**
```
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
```

**Check your email inbox** (testbro378@gmail.com) for the test email.

If this fails:
- Make sure your Gmail App Password is correct
- Verify 2FA is enabled on your Gmail account
- Check spam folder

---

## Step 2: Check Backend Logs

When you try to send an invoice, watch the backend console for these log messages:

```
[Invoice Controller] Resend invoice request received
[Invoice Controller] Payment ID: xxx
[Invoice Controller] User email: xxx
[Invoice Controller] Using admin email: xxx
[Invoice Controller] Generating PDF...
[Invoice Controller] Sending email...
[Invoice Service] Starting email send...
[Invoice Service] Sending to: xxx
[Invoice Service] Attempting to send email...
[Invoice Service] ✅ Email sent successfully!
```

If you see errors, they will show exactly where the problem is.

---

## Step 3: Test Invoice Email Manually

### Option A: Through Dashboard
1. Login to your ERP system
2. Go to **Subscription → Billing → Invoices & Receipts**
3. Click the **Email** button on any invoice
4. Check backend console for detailed logs
5. Check your email inbox

### Option B: Using API Directly

```bash
# Replace PAYMENT_ID with an actual payment ID from your database
# Replace YOUR_TOKEN with your JWT token

curl -X POST http://localhost:5000/api/billing/invoices/PAYMENT_ID/resend \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Step 4: Get Your Payment IDs

If you don't know your payment IDs, run this query in your database:

```sql
SELECT 
  id, 
  "tenantId", 
  amount, 
  currency, 
  status, 
  "createdAt"
FROM 
  "SubscriptionPayment"
WHERE 
  status = 'SUCCEEDED'
ORDER BY 
  "createdAt" DESC
LIMIT 5;
```

Pick a payment ID from this list to test with.

---

## Step 5: Verify Your User Email

Make sure your admin user has an email in the database:

```sql
SELECT 
  id, 
  email, 
  role, 
  "tenantId"
FROM 
  "User"
WHERE 
  role = 'ADMIN';
```

If your admin user doesn't have an email, update it:

```sql
UPDATE "User"
SET email = 'testbro378@gmail.com'
WHERE role = 'ADMIN' AND email IS NULL;
```

---

## Common Issues & Solutions

### Issue 1: "No email address available"
**Solution:** Your admin user doesn't have an email set. Run the SQL query above to update it.

### Issue 2: "Email service not configured"
**Solution:** Check your `.env` file has SMTP_USER and SMTP_PASS set correctly.

### Issue 3: Email sends but doesn't arrive
**Solution:**
- Check spam folder
- Verify Gmail App Password is correct
- Make sure 2FA is enabled
- Try sending test email (Step 1)

### Issue 4: "Invalid login" or "Authentication failed"
**Solution:**
- Your Gmail App Password might be wrong
- Generate a new App Password:
  1. Go to https://myaccount.google.com/apppasswords
  2. Generate new password for "Mail"
  3. Update SMTP_PASS in .env
  4. Restart backend server

### Issue 5: "Invoice not found"
**Solution:** The payment ID doesn't exist or doesn't belong to your tenant. Check the payment ID using Step 4.

---

## Backend Log Checklist

When testing, you should see ALL of these logs:

- [x] `[Invoice Controller] Resend invoice request received`
- [x] `[Invoice Controller] Payment found`
- [x] `[Invoice Controller] Using admin email: xxx`
- [x] `[Invoice Controller] Generating PDF...`
- [x] `[Invoice Controller] PDF generated, size: XXX bytes`
- [x] `[Invoice Controller] Sending email...`
- [x] `[Invoice Service] Starting email send...`
- [x] `[Invoice Service] Sending to: xxx`
- [x] `[Invoice Service] Attempting to send email...`
- [x] `[Invoice Service] ✅ Email sent successfully!`
- [x] `[Invoice Controller] ✅ Email sent successfully`

If any of these is missing, that's where the problem is.

---

## Quick Test Command

After starting your backend, run:

```bash
# In another terminal
cd backend
node test-email.js
```

This will test your email configuration and send you a test email.

---

## Need Help?

If you're still having issues, check:
1. Backend console output (copy ALL the logs)
2. Frontend browser console (F12)
3. Your email inbox AND spam folder
4. Database for admin user email

The detailed logs will show exactly where the email is failing.
