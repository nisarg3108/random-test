# Finance Approval System - Testing Guide

## Quick Start Testing

### Step 1: Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Step 2: Setup Workflows (One-time)

#### Option A: Via API Call
Use Postman or curl to seed workflows:
```bash
curl -X POST http://localhost:5000/api/approvals/seed-workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Option B: Via Debug Endpoint
Navigate to: `http://localhost:5000/api/approvals/debug`
This will show you the current state and you can use seed-workflows from there.

### Step 3: Create Test Users

You need at least 2 users:
1. **Employee (USER role)** - To submit expense claims
2. **Manager (MANAGER role)** - To approve expense claims

Login credentials (if using seed data):
- Manager: `manager@test.com` / password from your seed
- User: `user@test.com` / password from your seed

### Step 4: Test the Full Flow

#### As USER (Employee):
1. Login with USER credentials
2. Navigate to **Finance → Expense Claims** (`/finance/expense-claims`)
3. Click **"New Claim"** button
4. Fill in the form:
   - **Title**: "Travel Expense - Client Meeting"
   - **Amount**: 150.50
   - **Expense Date**: Select today's date
   - **Category**: Select from dropdown (if none, create one first)
   - **Description**: "Taxi fare for client meeting downtown"
   - **Receipt URL** (optional): "https://example.com/receipt.pdf"
5. Click **"Submit"** or **"Create"**
6. You should see a success message: "Expense claim sent for approval"
7. The claim should appear in the list with status **"PENDING"**

#### As MANAGER (Approver):
1. Logout and login with MANAGER credentials
2. Navigate to **Finance → Finance Approvals** (`/finance/approvals`)
3. You should see the pending expense claim card
4. Review the claim details:
   - Amount: $150.50
   - Date, Category, Description
   - Submitted by the employee
5. To **Approve**:
   - Click **"Approve"** button
   - Confirm the action
   - You should see "Expense claim approved successfully!"
6. To **Reject**:
   - Click **"Reject"** button
   - Enter a reason: "Receipt is not clear, please resubmit"
   - The claim should be rejected

#### Verify the Result:
1. Login back as USER
2. Navigate to **Finance → Expense Claims**
3. The claim status should now show **"APPROVED"** or **"REJECTED"**
4. Check notifications (if implemented) for approval notification

## Testing Checklist

### Backend Testing
- [ ] Workflow exists for FINANCE/EXPENSE_CLAIM
- [ ] ExpenseClaim can be created via API
- [ ] WorkflowRequest is created when claim is submitted
- [ ] Approval is created in PENDING status
- [ ] Approval endpoint returns pending approvals
- [ ] Approve endpoint updates claim status to APPROVED
- [ ] Reject endpoint updates claim status to REJECTED
- [ ] Employee receives notification (if notifications are enabled)

### Frontend Testing
- [ ] User can navigate to Expense Claims page
- [ ] User can create a new expense claim
- [ ] Form validation works (required fields)
- [ ] Success message appears after submission
- [ ] Manager can navigate to Finance Approvals page
- [ ] Pending approvals are displayed correctly
- [ ] Claim details are visible (amount, date, category, etc.)
- [ ] Approve button works
- [ ] Reject button works and prompts for reason
- [ ] Loading spinner appears during operations
- [ ] Error messages are displayed properly
- [ ] Page refreshes after approval/rejection
- [ ] Navigation links work from Finance Dashboard

### Permission Testing
- [ ] USER role can access Expense Claims page
- [ ] USER role can create expense claims
- [ ] USER role cannot access Finance Approvals page (should be blocked)
- [ ] MANAGER role can access all finance pages
- [ ] MANAGER role can approve/reject claims
- [ ] ADMIN role can access all finance pages

## Common Test Scenarios

### Scenario 1: Create and Approve Simple Claim
**Steps:**
1. Login as USER
2. Create expense claim: "Coffee Meeting" - $25
3. Login as MANAGER
4. Approve the claim
5. Verify status changed to APPROVED

**Expected:** ✅ Claim approved, status updated, notification sent

### Scenario 2: Create and Reject Claim
**Steps:**
1. Login as USER
2. Create expense claim: "Expensive Lunch" - $500
3. Login as MANAGER
4. Reject with reason: "Amount exceeds policy limit"
5. Verify status changed to REJECTED

**Expected:** ✅ Claim rejected, reason recorded, notification sent

### Scenario 3: Multiple Pending Approvals
**Steps:**
1. Login as USER
2. Create 3 different expense claims
3. Login as MANAGER
4. See all 3 claims in Finance Approvals page
5. Approve 2, reject 1
6. Verify only approved/rejected claims remain

**Expected:** ✅ All claims processed correctly

### Scenario 4: No Workflow Configured
**Steps:**
1. Delete all workflows for FINANCE/EXPENSE_CLAIM
2. Login as USER
3. Create expense claim
4. Verify claim is created with status PENDING but no approval workflow

**Expected:** ✅ Claim created directly without approval (fallback behavior)

### Scenario 5: Multi-Step Approval (If Configured)
**Steps:**
1. Configure workflow with 2 steps: Manager → Director
2. Submit expense claim
3. Manager approves (Step 1)
4. Verify claim still PENDING
5. Director approves (Step 2)
6. Verify claim now APPROVED

**Expected:** ✅ Multi-step approval works correctly

## API Testing with curl/Postman

### Create Expense Claim
```bash
curl -X POST http://localhost:5000/api/finance/expense-claims \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Travel Expense",
    "amount": 150.50,
    "expenseDate": "2026-02-01T00:00:00Z",
    "categoryId": "CATEGORY_ID",
    "description": "Client meeting travel",
    "receiptUrl": "https://example.com/receipt.pdf"
  }'
```

### List Pending Approvals
```bash
curl -X GET http://localhost:5000/api/approvals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Expense Claim
```bash
curl -X POST http://localhost:5000/api/approvals/APPROVAL_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Approved"}'
```

### Reject Expense Claim
```bash
curl -X POST http://localhost:5000/api/approvals/APPROVAL_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Receipt not clear"}'
```

## Troubleshooting

### Issue: "No pending approvals"
**Possible Causes:**
- No workflows configured → Run seed-workflows
- No expense claims submitted → Create a claim first
- User doesn't have MANAGER role → Check user permissions
- Claims already approved/rejected → Check claim status

**Solution:**
1. Verify workflow exists: `GET /api/workflows`
2. Seed workflows if needed: `POST /api/approvals/seed-workflows`
3. Check user role in database
4. Create new expense claim

### Issue: "Failed to approve request"
**Possible Causes:**
- User doesn't have permission → Must be MANAGER or ADMIN
- Approval already processed → Check approval status
- Invalid approval ID → Verify ID is correct
- Expense claim doesn't exist → Check database

**Solution:**
1. Check backend logs for detailed error
2. Verify user role: `SELECT role FROM User WHERE id = 'USER_ID'`
3. Check approval status: `SELECT status FROM Approval WHERE id = 'APPROVAL_ID'`
4. Verify expense claim exists: `SELECT * FROM ExpenseClaim WHERE id = 'CLAIM_ID'`

### Issue: Expense claim created but no approval generated
**Possible Causes:**
- No workflow configured for FINANCE/EXPENSE_CLAIM
- Workflow exists but has no steps
- Error in createApprovalChain function

**Solution:**
1. Check if workflow exists:
   ```sql
   SELECT * FROM Workflow WHERE module = 'FINANCE' AND action = 'EXPENSE_CLAIM'
   ```
2. Seed workflows: `POST /api/approvals/seed-workflows`
3. Check backend logs for errors

### Issue: Frontend shows "Failed to load approvals"
**Possible Causes:**
- Backend not running
- Authentication token expired
- CORS issues
- API endpoint not accessible

**Solution:**
1. Verify backend is running on port 5000
2. Check browser console for errors
3. Verify token is valid: Check localStorage
4. Test API directly with curl/Postman

## Debug Mode

### Enable Debug Logging
In backend, add console logs:
```javascript
// In approval.service.js
console.log('Fetching approvals for tenant:', tenantId);
console.log('Found approvals:', approvals.length);
```

### Check Database State
```sql
-- View all expense claims
SELECT * FROM ExpenseClaim ORDER BY createdAt DESC;

-- View all pending approvals
SELECT * FROM Approval WHERE status = 'PENDING';

-- View all workflow requests
SELECT * FROM WorkflowRequest WHERE module = 'FINANCE';

-- View all workflows
SELECT * FROM Workflow WHERE module = 'FINANCE';
```

### Browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter for "approvals" or "expense"
4. Check request/response for errors
5. Check Console tab for JavaScript errors

## Success Criteria

A successful test should show:
- ✅ Expense claim created with PENDING status
- ✅ WorkflowRequest created and linked to workflow
- ✅ Approval created in PENDING status
- ✅ Finance Approvals page displays the claim
- ✅ Manager can approve/reject the claim
- ✅ Expense claim status updates to APPROVED/REJECTED
- ✅ Employee receives notification (if enabled)
- ✅ Approval disappears from pending list
- ✅ Audit log created for the approval action

## Performance Testing

### Load Test Scenarios
1. Create 100 expense claims
2. Check approval page performance
3. Measure approval processing time
4. Test with multiple concurrent approvals

### Expected Performance
- Page load: < 2 seconds
- Approval action: < 1 second
- No memory leaks after 50+ operations

## Next Steps After Testing

1. **Document Issues** - Report any bugs found
2. **Enhance UI** - Add filters, search, sorting
3. **Add Analytics** - Track approval metrics
4. **Email Notifications** - Send emails for pending approvals
5. **Mobile Optimization** - Test on mobile devices
6. **Accessibility** - Add ARIA labels, keyboard navigation
7. **Performance** - Implement pagination for large datasets
8. **Audit Trail** - Show full history of approvals

## Contact & Support

If you encounter issues during testing:
1. Check backend logs: `backend/logs/` or console
2. Check frontend console in browser DevTools
3. Review this testing guide
4. Check implementation documentation: `FINANCE_APPROVAL_IMPLEMENTATION.md`

Happy Testing! 🚀
