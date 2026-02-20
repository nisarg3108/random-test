# Webhook URLs for Railway Deployment

## 🔗 Your Webhook Endpoints

Once deployed to Railway, your webhook URLs will be:

```
https://your-app-name.up.railway.app/api/billing/webhooks/stripe
https://your-app-name.up.railway.app/api/billing/webhooks/razorpay
```

Replace `your-app-name` with your actual Railway domain.

---

## 🎯 Stripe Webhook Setup

### 1. Get Your Railway URL
After deploying to Railway:
- Go to your Railway project dashboard
- Click on your backend service
- Copy the domain (e.g., `your-app-name.up.railway.app`)

### 2. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter webhook URL:
   ```
   https://your-app-name.up.railway.app/api/billing/webhooks/stripe
   ```
4. Select events to listen for:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to Railway environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 💳 Razorpay Webhook Setup

### 1. Configure Razorpay Webhook

1. Go to [Razorpay Dashboard → Webhooks](https://dashboard.razorpay.com/app/webhooks)
2. Click **"Create Webhook"**
3. Enter webhook URL:
   ```
   https://your-app-name.up.railway.app/api/billing/webhooks/razorpay
   ```
4. Select events:
   - ✅ `subscription.activated`
   - ✅ `subscription.charged`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
   - ✅ `payment.captured`
   - ✅ `payment.failed`
5. Set a secret token (any random string)
6. Click **"Create Webhook"**
7. Add to Railway environment variables:
   ```
   RAZORPAY_WEBHOOK_TOKEN=your_secret_token_here
   ```

---

## 🧪 Testing Webhooks

### Local Testing (Before Railway)

Use ngrok to test webhooks locally:

```bash
# Install ngrok
npm i -g ngrok

# Start your backend
cd backend
npm run dev

# In another terminal, expose port 5000
ngrok http 5000

# Use the ngrok URL for webhook testing
# Example: https://abc123.ngrok.io/api/billing/webhooks/stripe
```

### Railway Testing

After deployment, test using the built-in test endpoints:

**Stripe Test:**
```bash
curl -X POST https://your-app-name.up.railway.app/api/billing/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{"eventType": "customer.subscription.updated", "tenantId": "your-tenant-id"}'
```

**Razorpay Test:**
```bash
curl -X POST https://your-app-name.up.railway.app/api/billing/webhooks/razorpay/test \
  -H "Content-Type: application/json" \
  -d '{"eventType": "subscription.activated", "tenantId": "your-tenant-id"}'
```

---

## 📋 Railway Environment Variables Checklist

Add these to Railway → Your Service → Variables:

```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxx
STRIPE_PRICE_GROWTH_YEARLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_TOKEN=your_secret_token
```

---

## 🔍 Verify Webhook Setup

### Check Stripe Webhook Status
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check "Recent deliveries" tab
4. Should see successful 200 responses

### Check Razorpay Webhook Status
1. Go to Razorpay Dashboard → Webhooks
2. Click on your webhook
3. View "Logs" to see delivery status

### Check Railway Logs
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway link

# View logs
railway logs
```

Look for webhook processing logs:
```
[Webhook] Stripe webhook received: customer.subscription.updated
[Webhook] Processing event: evt_xxxxx
[Webhook] Event processed successfully
```

---

## 🚨 Troubleshooting

### Webhook Not Receiving Events

1. **Check Railway URL is correct**
   - Ensure no typos in webhook URL
   - URL should be HTTPS (Railway provides this automatically)

2. **Verify environment variables**
   ```bash
   railway variables
   ```

3. **Check Railway logs for errors**
   ```bash
   railway logs --filter webhook
   ```

4. **Test webhook manually**
   - Use Stripe CLI: `stripe trigger customer.subscription.updated`
   - Or use Razorpay test mode

### Webhook Signature Verification Failed

- **Stripe**: Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe dashboard
- **Razorpay**: Ensure `RAZORPAY_WEBHOOK_TOKEN` matches the secret set in Razorpay dashboard

### Events Not Processing

Check database for failed events:
```sql
SELECT * FROM "BillingEvent" WHERE status = 'FAILED' ORDER BY "createdAt" DESC;
```

---

## 📝 Quick Reference

| Provider | Webhook URL | Environment Variable |
|----------|-------------|---------------------|
| Stripe | `/api/billing/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET` |
| Razorpay | `/api/billing/webhooks/razorpay` | `RAZORPAY_WEBHOOK_TOKEN` |

**Full URLs:**
- Stripe: `https://[your-railway-domain]/api/billing/webhooks/stripe`
- Razorpay: `https://[your-railway-domain]/api/billing/webhooks/razorpay`
