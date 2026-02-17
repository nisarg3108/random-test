# Registration → Payment → Tenant + Admin Creation Flow

## Overview
Complete end-to-end SaaS registration flow with payment integration. The system follows this sequence:

```
User Registration Form
    ↓
Payment Checkout (Stripe/Razorpay)
    ↓
Payment Success Webhook
    ↓
Tenant Created (Company)
    ↓
Admin User Created (Under Tenant)
    ↓
Subscription Activated
    ↓
Modules Synced
```

---

## 1. Registration Form (Frontend)

### Input Fields (from schema)
```javascript
{
  email: "admin@company.com",
  password: "SecurePassword123",
  companyName: "Acme Corp",
  billingCycle: "MONTHLY" | "YEARLY",
  planId: "plan-uuid" | null,
  customModules: ["INVENTORY", "HR", "FINANCE"] | null,
  provider: "STRIPE" | "RAZORPAY"
}
```

### Process Flow
1. User submits registration form
2. Frontend validates input
3. Call `/api/auth/register/checkout` → Creates pending registration + payment session
4. Redirect to payment provider (Stripe Checkout/Razorpay Payment Link)

---

## 2. Backend: Create Pending Registration

### Endpoint
```
POST /api/auth/register/checkout
```

### What Happens
```javascript
// In auth.controller.js - registerCheckout()
1. Validates input (email, password, companyName)
2. Checks if email already exists
3. Resolves plan & calculates amount
4. Creates PendingRegistration record with status: "PENDING"
5. Initiates payment checkout with provider
6. Returns redirect URL to frontend
```

### PendingRegistration Record
```prisma
{
  id: "uuid",
  email: "admin@company.com",
  passwordHash: "bcrypted-password",
  companyName: "Acme Corp",
  planId: "plan-uuid",
  customModules: ["INVENTORY", "HR"],
  billingCycle: "MONTHLY",
  provider: "STRIPE",
  amount: 99.99,
  currency: "USD",
  status: "PENDING",
  expiresAt: now + 24 hours
}
```

---

## 3. Payment Processing

### Stripe Flow
```
1. Create Checkout Session
   - Include: pendingRegistrationId in metadata
   - Include: email, amount, currency

2. User completes payment on Stripe's checkout page

3. Stripe sends webhook event: "checkout.session.completed"
```

### Razorpay Flow
```
1. Create Payment Link
   - Include: pendingRegistrationId in notes
   - Include: email, amount, currency

2. User completes payment on Razorpay's page

3. Razorpay sends webhook event with payment details
```

---

## 4. Payment Webhook Processing

### Stripe Webhook: `checkout.session.completed`
```
POST /api/webhooks/stripe
Body: { type: "checkout.session.completed", data: { object: { ... } } }

Processing:
1. Verify webhook signature
2. Extract pendingRegistrationId from metadata
3. Call finalizePendingRegistration()
4. Create tenant, admin user, subscription
5. Store payment record
6. Return 200 OK
```

### Razorpay Webhook: `payment.authorized`
```
POST /api/webhooks/razorpay
Body: { event: "payment.authorized", payload: { ... } }

Processing:
1. Verify webhook signature
2. Extract pendingRegistrationId from notes
3. Call finalizePendingRegistration()
4. Create tenant, admin user, subscription
5. Store payment record
6. Return 200 OK
```

---

## 5. Finalize Pending Registration

### Function: `finalizePendingRegistration()`
**Location**: `backend/src/core/auth/auth.service.js`

**Steps**:
```javascript
1. Retrieve PendingRegistration record by ID
   - Check if already COMPLETED
   - Check if EXPIRED
   
2. Create Tenant
   const tenant = {
     name: pending.companyName,
     // Relations auto-created: users[], config, subscriptions[]
   }
   
3. Create Admin User
   const user = {
     email: pending.email,
     password: pending.passwordHash,
     role: "ADMIN",
     tenantId: tenant.id
   }
   
4. Create Subscription
   const subscription = {
     tenantId: tenant.id,
     planId: pending.planId,
     status: "ACTIVE",
     currentPeriodStart: now,
     currentPeriodEnd: now + billingCycle,
     provider: "STRIPE" | "RAZORPAY",
     items: [
       { moduleKey: "INVENTORY", unitPrice: 10 },
       { moduleKey: "HR", unitPrice: 10 },
       { moduleKey: "FINANCE", unitPrice: 10 }
     ]
   }
   
5. Sync Company Modules
   - Create CompanyConfig with enabled modules
   - Map modules from subscription items
   
6. Store Payment Record
   const payment = {
     subscriptionId: subscription.id,
     tenantId: tenant.id,
     amount: session.amount_total,
     currency: session.currency,
     status: "SUCCEEDED",
     providerPaymentId: session.payment_intent,
     succeededAt: now
   }
   
7. Update PendingRegistration
   - Set status: "COMPLETED"
   - Set tenantId: tenant.id
   - Set completedAt: now
```

---

## 6. Database Models

### PendingRegistration
```prisma
model PendingRegistration {
  id           String   @id @default(uuid())
  email        String
  passwordHash String
  companyName  String
  planId       String?
  customModules Json?
  billingCycle String?
  provider     String   // STRIPE | RAZORPAY
  amount       Float
  currency     String   @default("USD")
  status       String   @default("PENDING") // PENDING | COMPLETED | EXPIRED
  tenantId     String?
  createdAt    DateTime @default(now())
  completedAt  DateTime?
  expiresAt    DateTime?
}
```

### Tenant
```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  
  users   User[]
  config  CompanyConfig?
  subscriptions Subscription[]
  items   Item[]
}
```

### User (Admin)
```prisma
model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
  role     String @default("ADMIN")
  status   String @default("ACTIVE")
  
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

### Subscription
```prisma
model Subscription {
  id                     String   @id @default(uuid())
  tenantId               String
  planId                 String
  status                 String   @default("ACTIVE")
  startAt                DateTime @default(now())
  currentPeriodStart     DateTime @default(now())
  currentPeriodEnd       DateTime
  provider               String?  // STRIPE | RAZORPAY
  providerSubscriptionId String?
  providerCustomerId     String?
  
  tenant Tenant @relation(fields: [tenantId], references: [id])
  plan   Plan   @relation(fields: [planId], references: [id])
  items  SubscriptionItem[]
  payments SubscriptionPayment[]
}
```

---

## 7. API Endpoints

### Register with Payment Checkout
```
POST /api/auth/register/checkout
Content-Type: application/json

Request:
{
  "email": "admin@company.com",
  "password": "SecurePassword123",
  "companyName": "Acme Corp",
  "billingCycle": "MONTHLY",
  "planId": "plan-uuid",
  "customModules": ["INVENTORY", "HR"],
  "provider": "STRIPE"
}

Response (Success):
{
  "message": "Checkout session created",
  "redirectUrl": "https://checkout.stripe.com/pay/cs_..."
}

Response (Error):
{
  "message": "Missing required fields",
  "error": "INVALID_INPUT"
}
```

### Login After Registration
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "admin@company.com",
  "password": "SecurePassword123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Webhooks

#### Stripe Webhook
```
POST /api/webhooks/stripe
Headers: stripe-signature: <signature>

Handles Events:
- checkout.session.completed → Finalize registration
- charge.succeeded → Update payment status
- charge.failed → Handle failed payment
- invoice.payment_succeeded → Update invoice status
- customer.subscription.updated → Update subscription
- customer.subscription.deleted → Handle cancellation
```

#### Razorpay Webhook
```
POST /api/webhooks/razorpay
Headers: x-razorpay-signature: <signature>

Handles Events:
- payment.authorized → Finalize registration
- payment.failed → Handle failed payment
- payment.captured → Update payment status
```

---

## 8. Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# App Config
FRONTEND_URL=http://localhost:5173
DEFAULT_PLAN=Starter Monthly
PENDING_REGISTRATION_TTL_HOURS=24

# Database
DATABASE_URL=postgresql://...
```

---

## 9. Error Handling

### Payment Failures
```javascript
1. Webhook receives payment.failed event
2. Log failure with reason
3. Do NOT finalize registration
4. Keep PendingRegistration in PENDING status
5. User can retry payment
6. PendingRegistration expires after 24 hours
```

### Duplicate Processing
```javascript
1. Check if webhook event already processed (by providerEventId)
2. If already processed, return early with 200 OK
3. Prevents double-charging and duplicate tenant creation
```

### Expired Registrations
```javascript
1. Middleware checks if PendingRegistration.expiresAt < now
2. If expired, set status to EXPIRED
3. Return error: "Pending registration expired"
4. User must start new registration
```

---

## 10. Implementation Checklist

### Backend
- [x] PendingRegistration model in schema
- [x] auth.controller.js - registerCheckout()
- [x] auth.service.js - createPendingRegistration()
- [x] auth.service.js - finalizePendingRegistration()
- [x] Stripe integration - createCheckoutSession()
- [x] Razorpay integration - createPaymentLink()
- [x] webhook.controller.js - stripeWebhookController()
- [x] webhook.controller.js - razorpayWebhookController()
- [x] stripe.service.js - handleStripeWebhookEvent()
- [x] razorpay.service.js - handleRazorpayWebhookEvent()
- [x] Payment webhook routes

### Frontend
- [ ] Registration form component
- [ ] Payment provider selection
- [ ] Checkout redirect handling
- [ ] Success/error page
- [ ] Login page

### Testing
- [ ] Unit tests for auth service
- [ ] Integration tests for registration flow
- [ ] Webhook signature verification tests
- [ ] Payment success scenario
- [ ] Payment failure scenario
- [ ] Duplicate webhook handling

---

## 11. Testing Scenarios

### Scenario 1: Successful Stripe Registration
```
1. Fill registration form
2. Submit with provider: "STRIPE"
3. Redirect to Stripe Checkout
4. Complete payment
5. Stripe sends checkout.session.completed webhook
6. finalizePendingRegistration() called
7. ✅ Tenant created
8. ✅ Admin user created
9. ✅ Subscription activated
10. ✅ User can login
```

### Scenario 2: Payment Failure
```
1. Fill registration form
2. Submit with provider: "STRIPE"
3. Redirect to Stripe Checkout
4. Decline card
5. Stripe sends charge.failed webhook
6. PendingRegistration stays in PENDING
7. User can retry
8. ❌ No tenant/user created until successful payment
```

### Scenario 3: Successful Razorpay Registration
```
1. Fill registration form
2. Submit with provider: "RAZORPAY"
3. Redirect to Razorpay payment link
4. Complete payment
5. Razorpay sends payment.authorized webhook
6. finalizePendingRegistration() called
7. ✅ Tenant created
8. ✅ Admin user created
9. ✅ Subscription activated
10. ✅ User can login
```

---

## 12. Key Features

### ✅ Multi-Tenant Architecture
- Each company gets isolated tenant
- Admin user created under tenant
- Modules scoped to tenant's subscription

### ✅ Payment Security
- Webhook signature verification
- Idempotent webhook processing
- Pending registration TTL (24 hours)
- Duplicate event handling

### ✅ Flexible Billing
- Support for multiple providers (Stripe, Razorpay)
- Monthly/Yearly billing cycles
- Module-based pricing
- Custom module selection

### ✅ Automated Onboarding
- Tenant created on payment success
- Admin user created automatically
- Company config initialized
- Modules synced from subscription

---

## 13. Complete Code Flow

### Step 1: User submits registration
```javascript
// Frontend
POST /api/auth/register/checkout
{
  email: "admin@company.com",
  password: "SecurePassword123",
  companyName: "Acme Corp",
  billingCycle: "MONTHLY",
  planId: "plan-123",
  customModules: ["INVENTORY", "HR"],
  provider: "STRIPE"
}
```

### Step 2: Backend creates pending registration
```javascript
// auth.controller.js - registerCheckout()
const pending = await createPendingRegistration(req.body);
// pending.id = "pending-123"
// pending.status = "PENDING"
```

### Step 3: Create Stripe session
```javascript
// stripe.service.js
const session = await stripeService.createCheckoutSession({
  pendingRegistrationId: "pending-123",
  email: "admin@company.com",
  amount: 99.99,
  currency: "USD",
  successUrl: "http://localhost:5173/login?payment=success",
  cancelUrl: "http://localhost:5173/register?payment=cancel"
});
// session.url = "https://checkout.stripe.com/pay/cs_..."
```

### Step 4: User completes payment
```
User clicks link → Stripe checkout → Enters card → Payment processed
```

### Step 5: Stripe sends webhook
```javascript
// Stripe webhook event
{
  id: "evt_123",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_123",
      customer: "cus_123",
      payment_intent: "pi_123",
      amount_total: 9999,
      currency: "usd",
      metadata: {
        pendingRegistrationId: "pending-123"
      }
    }
  }
}
```

### Step 6: Backend handles webhook
```javascript
// webhook.controller.js - stripeWebhookController()
// stripe.service.js - handleStripeWebhookEvent()
// stripe.service.js - handleCheckoutSessionCompleted()

await finalizePendingRegistration("pending-123", "STRIPE");
```

### Step 7: Finalize registration
```javascript
// auth.service.js - finalizePendingRegistration()

// 1. Create tenant
const tenant = await prisma.tenant.create({
  data: { name: "Acme Corp" }
});
// tenant.id = "tenant-123"

// 2. Create admin user
const user = await prisma.user.create({
  data: {
    email: "admin@company.com",
    password: "bcrypted-password",
    role: "ADMIN",
    tenantId: "tenant-123"
  }
});
// user.id = "user-123"

// 3. Create subscription
const subscription = await prisma.subscription.create({
  data: {
    tenantId: "tenant-123",
    planId: "plan-123",
    status: "ACTIVE",
    provider: "STRIPE",
    providerCustomerId: "cus_123"
  }
});
// subscription.id = "sub-123"

// 4. Create subscription items
await prisma.subscriptionItem.createMany({
  data: [
    { subscriptionId: "sub-123", moduleKey: "INVENTORY", unitPrice: 10 },
    { subscriptionId: "sub-123", moduleKey: "HR", unitPrice: 10 }
  ]
});

// 5. Sync modules
await syncCompanyModulesFromSubscription("tenant-123");

// 6. Record payment
await prisma.subscriptionPayment.create({
  data: {
    subscriptionId: "sub-123",
    tenantId: "tenant-123",
    amount: 99.99,
    currency: "USD",
    status: "SUCCEEDED",
    providerPaymentId: "pi_123",
    succeededAt: new Date()
  }
});

// 7. Mark pending registration complete
await prisma.pendingRegistration.update({
  where: { id: "pending-123" },
  data: {
    status: "COMPLETED",
    tenantId: "tenant-123",
    completedAt: new Date()
  }
});
```

### Step 8: User logs in
```javascript
// Frontend
POST /api/auth/login
{
  email: "admin@company.com",
  password: "SecurePassword123"
}

// Response
{
  message: "Login successful",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 9: Access tenant resources
```javascript
// User authenticated with token
GET /api/dashboard
Headers: Authorization: Bearer <token>

// Backend identifies user's tenantId from token
// Returns tenant-specific data (users, items, subscriptions, etc.)
```

---

## Summary

The complete registration flow ensures:
1. **Secure Payment** - Verified webhooks, duplicate prevention
2. **Isolated Tenants** - Each company gets own database partition
3. **Admin Ready** - Tenant admin created automatically
4. **Module Sync** - Enabled modules mapped to subscription
5. **Error Recovery** - Failed payments don't create half-baked tenants
6. **User-Friendly** - Seamless checkout experience

All database records are created **only after successful payment**, ensuring data consistency and preventing orphaned records.

