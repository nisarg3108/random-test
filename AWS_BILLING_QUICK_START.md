# AWS-Style Billing Module - Quick Start Guide

## 🚀 Quick Start (3 Minutes)

### Step 1: Access the Module

**Option A:** From Company Settings
1. Navigate to **Settings → Company Settings**
2. Click the **"Manage Billing"** button (top right)

**Option B:** Direct URL
```
http://localhost:5173/subscription/billing
```

### Step 2: Explore the Dashboard

You'll see **6 tabs** (AWS-style):

1. **📊 Overview** - Account summary, plan details, and quick plan change
2. **💳 Payment Methods** - View and manage payment methods
3. **📜 Payment History** - All transactions with filtering and export
4. **🧾 Invoices** - Download invoices and receipts
5. **⚙️ Preferences** - Billing preferences and notifications
6. **📈 Analytics** - Cost breakdown and spending analytics

### Step 3: Common Tasks

#### View Current Subscription
- Go to **Overview** tab
- See 4 summary cards:
  - Current Plan
  - Status & Days Remaining
  - Total Paid
  - Next Billing Date

#### Change Your Plan
1. Go to **Overview** tab
2. Scroll to "Change Plan" section
3. Select new plan from dropdown
4. Click **"Change to [Plan Name] Plan"**
5. Done! ✅

#### View Payment History
1. Go to **Payment History** tab
2. Filter by:
   - Status: All / Succeeded / Failed / Pending
   - Date: Last 7/30/90/365 days or All Time
3. Click **"Export CSV"** to download

#### Download an Invoice
1. Go to **Payment History** tab
2. Find a successful payment
3. Click the download icon (📥) in the Actions column

## 🎯 Key Features at a Glance

| Feature | Location | What You Can Do |
|---------|----------|-----------------|
| **Plan Management** | Overview Tab | View current plan, change plans |
| **Subscription Details** | Overview Tab | Billing cycle, dates, auto-renew status |
| **Payment Methods** | Payment Methods Tab | View connected payment providers |
| **Transaction History** | Payment History Tab | View all payments with filters |
| **Export Data** | Payment History Tab | Download CSV of payments |
| **Cost Analytics** | Analytics Tab | Monthly cost, YTD spending, breakdown |
| **Billing Preferences** | Preferences Tab | Email notifications, billing address, tax info |

## 🔧 Configuration Check

### Verify Your Setup:

**1. Check Environment Variables**
```bash
# Backend .env file should have:
STRIPE_SECRET_KEY=sk_test_xxxxx              # ✅ Set
STRIPE_WEBHOOK_SECRET=whsec_xxxxx            # ✅ Set
RAZORPAY_KEY_ID=rzp_test_xxxxx               # Optional
RAZORPAY_KEY_SECRET=xxxxx                    # Optional
```

**2. Verify Webhooks**
- **Stripe**: https://dashboard.stripe.com/webhooks
  - Endpoint: `YOUR_URL/api/billing/webhooks/stripe`
  - Events: `checkout.session.completed`, `charge.succeeded`

- **Razorpay**: https://dashboard.razorpay.com/app/webhooks  
  - Endpoint: `YOUR_URL/api/billing/webhooks/razorpay`
  - Events: `payment.captured`, `invoice.paid`

**3. Test Payment Processing**
```bash
# Use Stripe test card
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

## 💡 Pro Tips

### Filtering Payments Efficiently
- Use **"Last 30 Days"** for recent activity
- Filter by **"SUCCEEDED"** to see completed payments only
- Export filtered results to CSV for accounting

### Managing Subscription
- Check **"Days Remaining"** card to see when renewal is due
- **"Auto Renew"** indicator shows if subscription will auto-renew
- Use **"Cancel Subscription"** button to cancel at period end

### Understanding Status Colors
- 🟢 **Green**: Successful, Active, Enabled
- 🔴 **Red**: Failed, Cancelled, Errors
- 🟡 **Yellow**: Pending, Processing, Warnings
- 🔵 **Blue**: Current selection, Information

## 🐛 Quick Troubleshooting

**Problem: Payment shows as PENDING but was successful**
```bash
✅ Fixed! Enhanced webhooks now properly update status.
→ Just refresh the page
→ Status should now show SUCCEEDED
```

**Problem: Can't access billing page**
```bash
→ Check: You have ADMIN role
→ Verify: You're logged in
→ Try: Clear browser cache and reload
```

**Problem: Export CSV button doesn't work**
```bash
→ Check: Browser allows downloads
→ Try: Different browser (Chrome/Firefox recommended)
→ Verify: JavaScript is enabled
```

## 📊 What's New (Improvements Made)

### ✅ Major Enhancements

**1. AWS-Style Interface**
- Professional tabbed navigation
- Clean, modern design matching AWS
- Gradient summary cards
- Responsive layout

**2. Advanced Filtering**
- Filter by payment status
- Filter by date ranges
- Real-time filtering

**3. Data Export**
- Export payments to CSV
- Apply filters before export
- Automatic file download

**4. Fixed Payment Status Issues** ⭐
- Added `payment.captured` handler for Razorpay
- Added `invoice.paid` handler for payment links
- Enhanced logging for debugging
- Status now updates correctly (PENDING → SUCCEEDED)

## 🎓 Next Steps

1. **Explore Each Tab**: Click through all 6 tabs to see available features
2. **Try Filtering**: Use the filters in Payment History to find specific transactions
3. **Export Data**: Export your payment history to CSV for records
4. **Check Analytics**: View cost breakdown in the Analytics tab
5. **Update Preferences**: Set up your billing preferences and notifications

## 📚 Full Documentation

For detailed technical documentation, see:
- [AWS_BILLING_MODULE_COMPLETE.md](AWS_BILLING_MODULE_COMPLETE.md) - Complete feature documentation
- [REGISTRATION_PAYMENT_FLOW_COMPLETE.md](REGISTRATION_PAYMENT_FLOW_COMPLETE.md) - Payment flow details

## 🎉 You're All Set!

Your AWS-style billing module is ready to use. Navigate to **Company Settings** and click **"Manage Billing"** to get started!

---

**Need Help?** Check the backend console logs for payment processing details.  
**Found a Bug?** Check troubleshooting section above or review full documentation.
