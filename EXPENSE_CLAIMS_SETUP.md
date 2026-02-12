# Expense Claims Approval Setup Guide

## Overview
The Expense Claims module includes a complete approval workflow system. When an employee submits an expense claim, it goes through an approval process before being approved or rejected by managers/admins.

## How It Works

### 1. Employee Submits Expense Claim
- Navigate to **Finance > Expense Claims**
- Click "New Claim" button
- Fill in the expense details (title, amount, date, category, etc.)
- Submit the claim

### 2. Approval Request Generated
- The system automatically creates an approval request
- Managers and Admins receive notifications
- The claim status shows as "PENDING"

### 3. Manager/Admin Reviews
- Navigate to **Finance > Finance Approvals** (visible only to MANAGER and ADMIN roles)
- View all pending expense claims
- Review claim details including:
  - Amount
  - Expense date
  - Category
  - Description
  - Receipt (if provided)
  - Employee who submitted

### 4. Approve or Reject
- Click "Approve" to approve the claim
- Click "Reject" and provide a reason to reject
- Employee receives notification of the decision
- Claim status updates to "APPROVED" or "REJECTED"

## Setup Instructions

### Step 1: Seed the Workflow (One-time setup)
The expense claim approval workflow needs to be initialized for your tenant.

**Option A: Using API (Recommended)**
```bash
# Make a POST request to seed workflows
curl -X POST http://localhost:5000/api/approvals/seed-workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Option B: Using Frontend**
1. Login as ADMIN or MANAGER
2. Open browser console (F12)
3. Run this code:
```javascript
fetch('http://localhost:5000/api/approvals/seed-workflows', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('ueorms_token')
  }
}).then(r => r.json()).then(console.log);
```

### Step 2: Verify Setup
Check if the workflow was created successfully:
```bash
curl http://localhost:5000/api/approvals/debug \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should see a workflow with:
- module: "FINANCE"
- action: "EXPENSE_CLAIM"
- status: "ACTIVE"

### Step 3: Test the Flow
1. Login as a regular USER
2. Go to **Finance > Expense Claims**
3. Create a new expense claim
4. Logout and login as MANAGER or ADMIN
5. Go to **Finance > Finance Approvals**
6. You should see the pending expense claim
7. Approve or reject it

## Permissions

### Required Permissions by Role

**USER (Employee)**
- `expense.claim` - Submit expense claims
- `expense.view` - View their own expense claims

**MANAGER/ADMIN**
- `expense.approve` - Approve/reject expense claims
- `expense.view` - View all expense claims

## Troubleshooting

### Issue: No approval requests showing up
**Solution:**
1. Ensure the workflow is seeded (see Step 1)
2. Check that you're logged in as MANAGER or ADMIN
3. Verify an expense claim was submitted by a user

### Issue: "Workflow not found" error
**Solution:**
Run the seed-workflows endpoint to create the workflow configuration

### Issue: Approval button not working
**Solution:**
1. Check browser console for errors
2. Verify your user has MANAGER or ADMIN role
3. Ensure the backend server is running

## API Endpoints

### Get Pending Approvals
```
GET /api/approvals
Authorization: Bearer {token}
```

### Approve Expense Claim
```
POST /api/approvals/{approvalId}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "comment": "Approved by finance manager"
}
```

### Reject Expense Claim
```
POST /api/approvals/{approvalId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Missing receipt or invalid expense"
}
```

### Get All Expense Claims
```
GET /api/finance/expense-claims
Authorization: Bearer {token}
```

## Database Schema

### ExpenseClaim Table
- `id` - Unique identifier
- `title` - Expense title
- `description` - Detailed description
- `amount` - Expense amount
- `expenseDate` - Date of expense
- `categoryId` - Expense category
- `employeeId` - Employee who submitted
- `status` - PENDING, APPROVED, or REJECTED
- `receiptUrl` - Optional receipt link

### Workflow Tables
- `Workflow` - Defines approval workflows
- `WorkflowStep` - Steps in each workflow
- `WorkflowRequest` - Individual approval requests
- `Approval` - Approval records for each step

## Features

✅ Multi-step approval workflow
✅ Real-time notifications
✅ Approval history tracking
✅ Rejection with reason
✅ Receipt attachment support
✅ Category-based expense tracking
✅ Employee expense history
✅ Manager approval dashboard

## Next Steps

After setting up expense claims, you can:
1. Create expense categories for better organization
2. Set up email notifications for approvals
3. Generate expense reports
4. Configure multi-level approval workflows
5. Integrate with accounting module

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the application logs
3. Verify database migrations are up to date
4. Ensure all required environment variables are set
