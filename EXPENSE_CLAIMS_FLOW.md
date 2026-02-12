# Expense Claims Approval Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPENSE CLAIMS APPROVAL FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   EMPLOYEE   │
│   (USER)     │
└──────┬───────┘
       │
       │ 1. Navigate to Finance > Expense Claims
       │ 2. Click "New Claim"
       │ 3. Fill in details:
       │    - Title
       │    - Amount
       │    - Date
       │    - Category
       │    - Description
       │    - Receipt (optional)
       │ 4. Submit
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESSING                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ expenseClaim.controller.js                          │    │
│  │  - Creates expense claim in database                │    │
│  │  - Status: PENDING                                  │    │
│  │  - Checks for workflow configuration                │    │
│  └─────────────────┬───────────────────────────────────┘    │
│                    │                                          │
│                    ▼                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ workflow.engine.js                                  │    │
│  │  - Finds FINANCE/EXPENSE_CLAIM workflow            │    │
│  │  - Creates WorkflowRequest                         │    │
│  │  - Creates Approval record                         │    │
│  │  - Links to expense claim                          │    │
│  └─────────────────┬───────────────────────────────────┘    │
│                    │                                          │
│                    ▼                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ notification.service.js                             │    │
│  │  - Notifies all MANAGER/ADMIN users                │    │
│  │  - Type: EXPENSE_CLAIM                             │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
       │
       │ Approval Request Created
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                  MANAGER/ADMIN DASHBOARD                      │
│                                                               │
│  Finance > Finance Approvals                                 │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Pending Expense Claim                             │     │
│  │  ─────────────────────────────────────────────     │     │
│  │  Title: Client Meeting Lunch                       │     │
│  │  Amount: $125.50                                   │     │
│  │  Date: 2024-01-15                                  │     │
│  │  Category: Travel                                  │     │
│  │  Employee: John Doe                                │     │
│  │  Description: Lunch meeting with client...         │     │
│  │                                                     │     │
│  │  [Approve]  [Reject]                              │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
       │
       │ Manager/Admin Decision
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   APPROVE           REJECT          IGNORE
       │                 │                 │
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ APPROVED    │   │ REJECTED    │   │ PENDING     │
│             │   │             │   │             │
│ - Update    │   │ - Update    │   │ - Remains   │
│   status    │   │   status    │   │   pending   │
│ - Notify    │   │ - Notify    │   │ - Can be    │
│   employee  │   │   employee  │   │   approved  │
│ - Complete  │   │ - Include   │   │   later     │
│   workflow  │   │   reason    │   │             │
│             │   │ - Reject    │   │             │
│             │   │   workflow  │   │             │
└─────────────┘   └─────────────┘   └─────────────┘
       │                 │
       │                 │
       ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    EMPLOYEE NOTIFICATION                      │
│                                                               │
│  ✅ Approved: "Your expense claim for Travel ($125.50)       │
│               has been approved"                             │
│                                                               │
│  ❌ Rejected: "Your expense claim for Travel ($125.50)       │
│               has been rejected: Missing receipt"            │
└──────────────────────────────────────────────────────────────┘
```

## Database Flow

```
┌─────────────────┐
│  ExpenseClaim   │
│  ─────────────  │
│  id             │
│  title          │
│  amount         │
│  status: PENDING│◄─────┐
│  employeeId     │      │
│  categoryId     │      │
└─────────────────┘      │
                         │
                         │ References
                         │
┌─────────────────┐      │
│ WorkflowRequest │      │
│  ─────────────  │      │
│  id             │      │
│  module: FINANCE│      │
│  action: EXPENSE│      │
│  payload: {     │──────┘
│    expenseClaimId
│  }              │
│  status: PENDING│
│  workflowId     │──────┐
└─────────────────┘      │
                         │
                         │ Links to
                         │
┌─────────────────┐      │
│    Workflow     │◄─────┘
│  ─────────────  │
│  id             │
│  module: FINANCE│
│  action: EXPENSE│
│  status: ACTIVE │
└─────────────────┘
        │
        │ Has steps
        ▼
┌─────────────────┐
│  WorkflowStep   │
│  ─────────────  │
│  id             │
│  stepOrder: 1   │
│  permission:    │
│  expense.approve│
└─────────────────┘
        │
        │ Creates
        ▼
┌─────────────────┐
│    Approval     │
│  ─────────────  │
│  id             │
│  status: PENDING│
│  workflowId     │
│  workflowStepId │
│  tenantId       │
└─────────────────┘
```

## API Call Sequence

```
1. Employee submits expense claim
   POST /api/finance/expense-claims
   {
     "title": "Client Meeting",
     "amount": 125.50,
     "expenseDate": "2024-01-15",
     "categoryId": "cat-123",
     "description": "Lunch meeting"
   }

2. Backend creates workflow request
   - Creates ExpenseClaim (status: PENDING)
   - Finds Workflow (FINANCE/EXPENSE_CLAIM)
   - Creates WorkflowRequest
   - Creates Approval record
   - Sends notifications

3. Manager fetches pending approvals
   GET /api/approvals
   Response: [
     {
       "id": "approval-123",
       "status": "PENDING",
       "workflow": {
         "module": "FINANCE",
         "action": "EXPENSE_CLAIM"
       }
     }
   ]

4. Manager approves
   POST /api/approvals/approval-123/approve
   {
     "comment": "Approved - Valid expense"
   }

5. Backend processes approval
   - Updates Approval (status: APPROVED)
   - Updates ExpenseClaim (status: APPROVED)
   - Updates WorkflowRequest (status: COMPLETED)
   - Sends notification to employee

6. Employee sees updated status
   GET /api/finance/expense-claims
   Response: [
     {
       "id": "claim-123",
       "status": "APPROVED",
       "title": "Client Meeting",
       "amount": 125.50
     }
   ]
```

## Status Transitions

```
ExpenseClaim Status:
PENDING ──┬──> APPROVED (via approval)
          └──> REJECTED (via rejection)

WorkflowRequest Status:
PENDING ──┬──> COMPLETED (all approvals done)
          ├──> REJECTED (any rejection)
          └──> FAILED (execution error)

Approval Status:
PENDING ──┬──> APPROVED (manager approves)
          └──> REJECTED (manager rejects)
```

## Key Files

### Backend
- `backend/src/modules/finance/expenseClaim.controller.js` - Handles claim creation
- `backend/src/modules/finance/expenseClaim.service.js` - Business logic
- `backend/src/core/workflow/workflow.engine.js` - Workflow processing
- `backend/src/core/workflow/approval.service.js` - Approval/rejection logic
- `backend/src/core/workflow/workflow.seed.js` - Workflow initialization

### Frontend
- `frontend/src/pages/finance/ExpenseClaimList.jsx` - Employee view
- `frontend/src/pages/finance/FinanceApprovals.jsx` - Manager approval view
- `frontend/src/store/finance.store.js` - State management

## Permissions Required

| Role    | Permission        | Can Do                          |
|---------|-------------------|---------------------------------|
| USER    | expense.claim     | Submit expense claims           |
| USER    | expense.view      | View own expense claims         |
| MANAGER | expense.approve   | Approve/reject expense claims   |
| MANAGER | expense.view      | View all expense claims         |
| ADMIN   | expense.approve   | Approve/reject expense claims   |
| ADMIN   | expense.view      | View all expense claims         |
