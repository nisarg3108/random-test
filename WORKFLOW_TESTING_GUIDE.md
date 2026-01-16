# Workflow Approval System - Testing Guide

## 🎯 Overview
The ERP system now has a complete workflow approval system for inventory operations (CREATE, UPDATE, DELETE).

## 👥 Test Users

### Admin User
- **Email**: admin@company.com
- **Password**: admin123
- **Role**: ADMIN
- **Permissions**: Can create/update/delete items (triggers approval workflow)

### Manager User
- **Email**: manager@company.com
- **Password**: manager123
- **Role**: MANAGER
- **Permissions**: Can approve inventory operations

## 🧪 Test Scenarios

### Test 1: Create Item with Approval
1. Login as **admin@company.com**
2. Navigate to Inventory page
3. Create a new item:
   ```json
   {
     "name": "Test Laptop",
     "sku": "LAPTOP-001",
     "price": 999.99,
     "quantity": 10,
     "description": "Test laptop for approval"
   }
   ```
4. **Expected**: 202 response with "Approval required" message
5. **Verify**: Item NOT in inventory list (pending approval)

### Test 2: Approve Pending Item
1. Logout and login as **manager@company.com**
2. Navigate to `/approvals` page
3. See pending approval for "Test Laptop"
4. Click **Approve** button
5. **Expected**: Approval disappears from list
6. Navigate to Inventory page
7. **Verify**: "Test Laptop" now appears in inventory

### Test 3: Reject Item Creation
1. Login as **admin@company.com**
2. Create another item:
   ```json
   {
     "name": "Test Mouse",
     "sku": "MOUSE-001",
     "price": 29.99,
     "quantity": 50
   }
   ```
3. Logout and login as **manager@company.com**
4. Navigate to `/approvals`
5. Click **Reject** button
6. Enter rejection reason: "Not needed"
7. **Expected**: Approval disappears
8. **Verify**: "Test Mouse" does NOT appear in inventory

### Test 4: Update Item with Approval
1. Login as **admin@company.com**
2. Update existing item (change price/quantity)
3. **Expected**: 202 response with "Update approval required"
4. **Verify**: Original values unchanged
5. Login as **manager@company.com**
6. Approve the update
7. **Verify**: Item updated with new values

### Test 5: Delete Item with Approval
1. Login as **admin@company.com**
2. Delete an item
3. **Expected**: 202 response with "Delete approval required"
4. **Verify**: Item still visible in inventory
5. Login as **manager@company.com**
6. Approve the deletion
7. **Verify**: Item removed from inventory

## 📡 API Endpoints

### Create Item (Requires Approval)
```bash
POST /api/items
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Item Name",
  "sku": "SKU-001",
  "price": 99.99,
  "quantity": 10,
  "description": "Description"
}

Response: 202 Approval required
```

### Get Pending Approvals
```bash
GET /api/approvals
Authorization: Bearer <manager_token>

Response: Array of pending approvals
```

### Approve Request
```bash
POST /api/approvals/:approvalId/approve
Authorization: Bearer <manager_token>

Response: { message: "Request approved and executed", executed: true }
```

### Reject Request
```bash
POST /api/approvals/:approvalId/reject
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Rejection reason"
}

Response: { message: "Request rejected", executed: false }
```

## 🔍 Verification Checklist

- [ ] CREATE operations require approval
- [ ] UPDATE operations require approval
- [ ] DELETE operations require approval
- [ ] Only users with `inventory.approve` permission can see approvals
- [ ] Approved items appear in inventory
- [ ] Rejected items do NOT appear in inventory
- [ ] Original data preserved until approval
- [ ] Real-time updates work after approval
- [ ] Audit logs capture approval actions

## 🎨 Frontend Routes

- `/inventory` - Inventory list
- `/approvals` - Pending approvals (Manager only)
- `/workflows` - Workflow configuration (Admin only)

## 🔧 Troubleshooting

### Issue: Getting 201 instead of 202
- Check workflow exists for tenant in database
- Verify module='INVENTORY' and action='CREATE/UPDATE/DELETE'
- Ensure workflow status is not 'COMPLETED'

### Issue: Manager can't see approvals
- Verify manager has `inventory.approve` permission
- Check RolePermission table for correct mapping
- Ensure manager is logged in with correct token

### Issue: Approval doesn't execute action
- Check approval service executeWorkflowAction function
- Verify action data is stored correctly
- Check server logs for errors

## 🚀 Next Steps

1. Add email notifications for pending approvals
2. Add approval history/audit trail
3. Add multi-step approval chains
4. Add conditional workflows based on item value
5. Add approval delegation
6. Add approval expiration/timeout