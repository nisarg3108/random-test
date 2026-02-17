# Billing Provider Integration & Webhooks

## Overview

The system supports billing provider integration with **Stripe** and **Razorpay**. This enables:
- Recurring subscriptions management
- Automated billing and payments
- Payment status tracking
- Webhook event handling for real-time updates
- Multi-provider support for global and regional coverage

## Architecture

### Database Models

#### SubscriptionPayment Model
Tracks all payment transactions for subscriptions:
```
- subscriptionId: Link to subscription
- tenantId: Tenant identifier  
- amount: Payment amount
- currency: Payment currency (USD, INR, etc.)
- status: PENDING | SUCCEEDED | FAILED | REFUNDED
- paymentMethodId: Provider-specific payment method ID
- providerPaymentId: Provider's payment ID (charge_id, payment_id)
- invoiceNumber: Invoice reference
- scheduledFor: When payment is scheduled
- attemptedAt, succeededAt, failedAt, refundedAt: Timeline
- failureCode, failureMessage: Error details if failed
- metadata: Additional JSON data
```

#### BillingEvent Model
Captures all webhook events from payment providers:
```
- tenantId: Tenant who triggered the event
- subscriptionId: Related subscription (if applicable)
- eventType: The webhook event type
- provider: STRIPE | RAZORPAY
- providerEventId: Provider's event ID (for deduplication)
- status: RECEIVED | PROCESSED | FAILED
- payload: Raw webhook JSON payload
- processedAt: When event was processed
- errorMessage: Error details if processing failed
```

### Service Layers

#### Stripe Service (`stripe.service.js`)
Handles all Stripe API interactions:
- `createStripeCustomer()` - Initialize customer
- `createStripeSubscription()` - Create recurring subscription
- `updatePaymentMethod()` - Add/change payment method
- `cancelStripeSubscription()` - Cancel subscription
- `getStripeSubscription()` - Fetch subscription details
- `createPaymentIntent()` - For manual payments
- `getStripePriceId()` - Map plan names to Stripe price IDs
- `handleStripeWebhookEvent()` - Process webhook events

**Supported Stripe Events:**
- `charge.succeeded` - Payment successful
- `charge.failed` - Payment failed
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Invoice payment failed

#### Razorpay Service (`razorpay.service.js`)
Handles all Razorpay API interactions:
- `createRazorpayCustomer()` - Initialize customer
- `createRazorpayPlan()` - Create billing plan
- `createRazorpaySubscription()` - Create recurring subscription
- `cancelRazorpaySubscription()` - Cancel subscription
- `getRazorpaySubscription()` - Fetch subscription details
- `createPaymentLink()` - One-time payment link
- `getRazorpayPayment()` - Fetch payment details
- `verifyWebhookSignature()` - Verify webhook authenticity
- `handleRazorpayWebhookEvent()` - Process webhook events

**Supported Razorpay Events:**
- `payment.authorized` - Payment successful
- `payment.failed` - Payment failed
- `subscription.activated` - Subscription active
- `subscription.pending` - Awaiting payment
- `subscription.halted` - Payment failed, subscription paused
- `subscription.cancelled` - Subscription canceled
- `subscription.completed` - All payments collected

### Controllers & Routes

#### Billing Routes (`/api/billing/`)

**User-Facing Endpoints (Require Authentication):**

```
GET /api/billing/subscription
- Get tenant's current subscription details
- Returns: Plan, modules, billing dates, payment method, recent payments
- Usage: Subscription overview page

POST /api/billing/subscription/change-plan
- Change to different subscription plan
- Body: { planId: string, provider?: string }
- Updates: Subscription plan, items, and provider if applicable

POST /api/billing/subscription/cancel
- Cancel subscription (immediately or at period end)
- Body: { atPeriodEnd?: boolean }
- Updates: Subscription status, adds cancelAt/canceledAt dates

GET /api/billing/payments
- Get payment history with pagination
- Query: ?limit=50&offset=0&status=SUCCEEDED
- Returns: List of all payments with status and dates

GET /api/billing/events
- Get billing webhook events (for debugging)
- Query: ?limit=50&offset=0&provider=STRIPE&status=PROCESSED
- Returns: Event log with timestamps

GET /api/billing/metrics
- Get billing usage statistics
- Returns: Days remaining, total paid, failure rate, next billing amount
```

**Webhook Endpoints (No Authentication):**

```
POST /api/billing/webhooks/stripe
- Stripe webhook endpoint
- Headers: stripe-signature (verified via Stripe SDK)
- Processes: Charge, subscription, and invoice events

POST /api/billing/webhooks/razorpay
- Razorpay webhook endpoint
- Headers: x-razorpay-signature (verified via HMAC)
- Processes: Payment and subscription events
```

**Testing Endpoints (Development Only):**

```
POST /api/billing/webhooks/stripe/test
- Simulate Stripe webhook event
- Body: { eventType: string, tenantId: string }
- Only available in development

POST /api/billing/webhooks/razorpay/test
- Simulate Razorpay webhook event
- Body: { eventType: string, tenantId: string }
- Only available in development
```

## Setup Instructions

### Prerequisites
- Node.js with `stripe` and `razorpay` packages
- Active Stripe or Razorpay account
- PostgreSQL database with migration

### 1. Database Migration

Run Prisma migration to create billing tables:
```bash
npx prisma migrate dev --name add-billing-tables
```

This creates:
- `SubscriptionPayment` table
- `BillingEvent` table
- Updates `Subscription` table with `payments` relation

### 2. Stripe Setup

#### Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy **Publishable Key** and **Secret Key**
3. Add to `.env`:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxx
   ```

#### Create Price IDs
1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Create products for each plan tier (Starter, Growth, Enterprise)
3. Add prices for each billing cycle (Monthly/Yearly)
4. Copy price IDs and add to `.env`:
   ```
   STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
   STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
   STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxx
   STRIPE_PRICE_GROWTH_YEARLY=price_xxxxx
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx
   ```

#### Setup Webhooks
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL: `https://yourdomain.com/api/billing/webhooks/stripe`
4. Select events:
   - `charge.succeeded`
   - `charge.failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing Secret** and add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 3. Razorpay Setup

#### Get API Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys-webhooks)
2. Copy **Key ID** and **Key Secret**
3. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxx
   ```

#### Setup Webhooks
1. Go to [Razorpay Webhooks](https://dashboard.razorpay.com/app/webhooks)
2. Click **Add new webhook**
3. Enter webhook URL: `https://yourdomain.com/api/billing/webhooks/razorpay`
4. Select events:
   - `payment.authorized`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.completed`
5. Copy **Webhook Token** and add to `.env`:
   ```
   RAZORPAY_WEBHOOK_TOKEN=webhook_token_xxxxx
   ```

### 4. Install Dependencies

```bash
npm install stripe razorpay
```

### 5. Update Subscription Creation

When registering a new tenant, the `createDefaultSubscription()` in `auth.service.js` automatically:
1. Queries the plan from database
2. Creates a `Subscription` record
3. Creates `SubscriptionItem` records for each module
4. Does NOT yet create provider subscription (manual setup needed)

To enable automatic provider subscription creation:
```javascript
// In auth.service.js createDefaultSubscription()
if (provider === 'STRIPE') {
  const customerId = await stripeService.createStripeCustomer(
    tenantId, 
    userEmail, 
    tenantName
  );
  const subscriptionObj = await stripeService.createStripeSubscription(
    tenantId,
    customerId,
    stripePriceId
  );
  // Update subscription with provider details
}
```

## Usage Examples

### Get Current Subscription
```bash
curl -X GET http://localhost:5000/api/billing/subscription \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "subscription": {
    "id": "sub_xxx",
    "status": "ACTIVE",
    "plan": {
      "id": "plan_xxx",
      "name": "Growth Monthly",
      "basePrice": 129
    },
    "modules": [
      { "moduleKey": "INVENTORY", "quantity": 1 },
      { "moduleKey": "SALES", "quantity": 1 }
    ],
    "billing": {
      "currentPeriodEnd": "2026-03-16",
      "daysRemaining": 28,
      "provider": "STRIPE"
    }
  }
}
```

### Change Plan
```bash
curl -X POST http://localhost:5000/api/billing/subscription/change-plan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_enterprise_monthly"
  }'
```

### Cancel Subscription
```bash
curl -X POST http://localhost:5000/api/billing/subscription/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "atPeriodEnd": true
  }'
```

### View Payment History
```bash
curl -X GET "http://localhost:5000/api/billing/payments?limit=10&status=SUCCEEDED" \
  -H "Authorization: Bearer <token>"
```

### Test Webhook (Development)
```bash
curl -X POST http://localhost:5000/api/billing/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "customer.subscription.updated",
    "tenantId": "tenant_xxx"
  }'
```

## Webhook Event Flow

### Stripe Payment Succeeded
```
1. Stripe sends charge.succeeded webhook
2. System receives and verifies webhook signature
3. BillingEvent created (RECEIVED status)
4. SubscriptionPayment created with SUCCEEDED status
5. BillingEvent updated to PROCESSED
6. Frontend can display payment confirmation
```

### Razorpay Payment Failed
```
1. Razorpay sends payment.failed webhook
2. System verifies HMAC signature
3. BillingEvent created (RECEIVED status)
4. SubscriptionPayment created with FAILED status
5. Subscription status updated to PAST_DUE
6. Customer notified via email (future enhancement)
7. BillingEvent updated to PROCESSED
```

## Error Handling

### Payment Failures
When a payment fails:
1. `SubscriptionPayment` record created with status `FAILED`
2. `failureCode` and `failureMessage` captured
3. Subscription status updated to `PAST_DUE`
4. Retry logic handled by provider (Stripe/Razorpay)

### Webhook Deduplication
Events are deduplicated by `providerEventId`:
- Stripe: Uses `event.id`
- Razorpay: Uses combination of `event_type` and timestamp
- Idempotent processing prevents duplicate charges

### Signature Verification
- **Stripe**: Verified using Stripe Node SDK with `STRIPE_WEBHOOK_SECRET`
- **Razorpay**: Verified using HMAC-SHA256 with `RAZORPAY_KEY_SECRET`

## Monitoring & Debugging

### View Billing Events
```bash
GET /api/billing/events?provider=STRIPE&status=RECEIVED
```

Shows all unprocessed webhook events for investigation.

### Check Payment Status
```bash
GET /api/billing/payments?status=FAILED
```

Shows failed payments that may need retry or customer action.

### Billing Metrics
```bash
GET /api/billing/metrics
```

Shows payment success rate, days until next billing, MRR (Monthly Recurring Revenue), ARR.

## Environment Variables

### Required
```
DATABASE_URL          # PostgreSQL connection
NODE_ENV             # development | production
```

### Stripe (if using)
```
STRIPE_PUBLISHABLE_KEY              # pk_test_xxxxx or pk_live_xxxxx
STRIPE_SECRET_KEY                   # sk_test_xxxxx or sk_live_xxxxx
STRIPE_PRICE_STARTER_MONTHLY        # price_xxxxx
STRIPE_PRICE_STARTER_YEARLY         # price_xxxxx
STRIPE_PRICE_GROWTH_MONTHLY         # price_xxxxx
STRIPE_PRICE_GROWTH_YEARLY          # price_xxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY     # price_xxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY      # price_xxxxx
STRIPE_WEBHOOK_SECRET               # whsec_xxxxx
```

### Razorpay (if using)
```
RAZORPAY_KEY_ID           # rzp_test_xxxxx or rzp_live_xxxxx
RAZORPAY_KEY_SECRET       # api_secret_xxxxx
RAZORPAY_WEBHOOK_TOKEN    # webhook_xxxxx
```

## Security Considerations

1. **Webhook Signature Verification**: All webhooks are verified before processing
2. **Idempotency**: Events deduplicated to prevent duplicate charges
3. **PCI Compliance**: No card data stored; payment providers handle PCI
4. **API Keys**: Store in environment variables, never commit to repository
5. **HTTPS Only**: Webhooks only accept HTTPS in production
6. **Rate Limiting**: Consider implementing rate limits on billing endpoints

## Future Enhancements

1. **Automatic Dunning**: Retry failed payments with exponential backoff
2. **Usage-Based Billing**: Track module usage and bill accordingly
3. **Proration**: Pro-rate charges when changing plans mid-cycle
4. **Invoicing**: Generate PDF invoices on payment success
5. **Multi-Currency**: Support multiple currencies per tenant
6. **Billing Portal**: Self-service customer billing management
7. **Discount Codes**: Support coupon/promo codes
8. **Tax Integration**: Calculate and collect sales tax

## Troubleshooting

### Webhook Not Triggering
- Check webhook URL is publicly accessible
- Verify webhook is enabled in provider dashboard
- Check provider event type is selected
- Review provider webhook delivery logs

### Payment Showing as Failed
- Check payment method validity
- Verify sufficient funds
- Check account/card not blocked by issuer
- Retry payment from billing portal

### Duplicate Payment Records
- Check `providerPaymentId` uniqueness in database
- Review webhook deduplication logic
- Check for duplicate webhook deliveries from provider

### Provider API Errors
- Verify API keys are correct
- Check rate limits not exceeded
- Verify account has required features enabled
- Review provider API status page
