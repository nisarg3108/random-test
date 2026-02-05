# Complete Role-Based Access Control (RBAC) Implementation Guide

## Overview

Your ERP system now has a comprehensive Role-Based Access Control (RBAC) system that ensures users only have access to features and data appropriate for their role.

## 🎯 What Changed

### Before
- All users had admin-level access
- No permission checking
- Limited role differentiation

### After
- **13 distinct roles** with specific permissions
- **Fine-grained permission system** (150+ permissions)
- **Role-based UI rendering** - users only see what they can access
- **Backend API protection** - all routes enforce permissions
- **Flexible role assignment** - users can have multiple roles

## 📋 Available Roles

### 1. **ADMIN** (Administrator)
- **Full system access** with all permissions
- Can manage all modules and users
- Assign/remove any role
- View audit logs and system settings

### 2. **HR_MANAGER** (HR Manager)
- Manages all HR operations
- Full employee management
- Attendance and leave approval
- Payroll management
- Can create and manage departments
- View HR analytics and reports

### 3. **HR_STAFF** (HR Staff)
- Day-to-day HR operations
- Create and update employee records
- View attendance and leave requests
- Cannot approve payroll or access sensitive data

### 4. **FINANCE_MANAGER** (Finance Manager)
- Manages all finance operations
- Accounting and expense management
- Approve expense claims and payroll
- View financial reports and analytics
- Asset depreciation tracking

### 5. **ACCOUNTANT**
- Handle accounting entries
- Manage financial records
- View expense claims
- Create financial reports
- Limited approval rights

### 6. **INVENTORY_MANAGER** (Inventory Manager)
- Full inventory control
- Warehouse management
- Stock movement approval
- Purchase order creation
- Inventory reports

### 7. **WAREHOUSE_STAFF** (Warehouse Staff)
- Daily warehouse operations
- Update inventory
- View stock levels
- Process stock movements

### 8. **SALES_MANAGER** (Sales Manager)
- Sales operations management
- Customer relationship management (CRM)
- Lead and deal management
- Sales reports and analytics
- Customer communication

### 9. **SALES_STAFF** (Sales Staff)
- Create sales orders
- Manage customer interactions
- Update leads and deals
- View customer information
- Limited approval rights

### 10. **PURCHASE_MANAGER** (Purchase Manager)
- Procurement operations
- Vendor management
- Purchase order approval
- Inventory requisitions

### 11. **PROJECT_MANAGER** (Project Manager)
- Project management
- Task assignment and tracking
- Team collaboration
- Document sharing
- Project reports

### 12. **MANAGER** (Department Manager)
- Team/department oversight
- Approve leave and expenses
- View team reports
- Assign tasks
- Limited cross-department access

### 13. **EMPLOYEE** (Standard Employee)
- Self-service features
- Mark attendance
- Request leave
- Submit expense claims
- View own information
- Update assigned tasks

### 14. **USER** (Basic User)
- Minimal access
- View own profile
- Basic document access

## 🚀 Setup Instructions

### Step 1: Run the RBAC Setup Script

```bash
cd backend
node setup-rbac.js
```

This script will:
- ✅ Create all 150+ permissions
- ✅ Set up all 14 roles with their permission mappings
- ✅ Migrate existing users to the new RBAC system
- ✅ Maintain backward compatibility with legacy roles

### Step 2: Verify Database Migration

The script automatically:
- Seeds the `Permission` table
- Creates `Role` records for each tenant
- Maps permissions to roles via `RolePermission`
- Assigns roles to existing users via `UserRole`
- Updates the legacy `User.role` field

### Step 3: Access Role Management UI

Navigate to `/roles` (admin only) to:
- View all available roles
- See user role assignments
- Assign/remove roles from users
- View permission details

## 💻 Using RBAC in Backend

### Check Permissions in Routes

```javascript
import { requirePermission } from '../core/rbac/permission.middleware.js';

// Single permission
router.post('/employees', 
  requireAuth,
  requirePermission('employee.create'),
  createEmployeeController
);

// Multiple permissions (OR logic - user needs ANY)
router.get('/dashboard',
  requireAuth,
  requirePermission(['hr.dashboard', 'manager.dashboard']),
  getDashboardController
);

// Multiple permissions (AND logic - user needs ALL)
router.post('/payroll/process',
  requireAuth,
  requirePermission(['payroll.process', 'payroll.approve'], { requireAll: true }),
  processPayrollController
);
```

### Check Roles in Routes

```javascript
import { requireRole } from '../core/rbac/permission.middleware.js';

// Single role
router.get('/admin', requireAuth, requireRole('ADMIN'), adminController);

// Multiple roles
router.get('/reports', 
  requireAuth, 
  requireRole(['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER']), 
  reportsController
);
```

### Get User Permissions in Controller

```javascript
import { attachUserPermissions } from '../core/rbac/permission.middleware.js';

router.get('/data', requireAuth, attachUserPermissions, async (req, res) => {
  // Access permissions
  const permissions = req.userPermissions; // Array of permission codes
  const roles = req.userRoles; // Array of role names
  
  // Conditional logic based on permissions
  if (permissions.includes('data.export')) {
    // Allow export
  }
});
```

## 🎨 Using RBAC in Frontend

### Hook Usage

```javascript
import { useAuth, RoleGuard, PermissionGuard } from '../hooks/useAuth';

function MyComponent() {
  const { user, hasRole, hasPermission, isAdmin } = useAuth();
  
  // Check single role
  if (hasRole('HR_MANAGER')) {
    // Show HR features
  }
  
  // Check permission
  if (hasPermission('employee.create')) {
    // Show create button
  }
  
  // Check multiple permissions (OR)
  if (hasPermission(['expense.approve', 'expense.view.all'])) {
    // User has at least one
  }
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Guard Components

```javascript
// Role-based rendering
<RoleGuard requiredRole="ADMIN" fallback={<div>Access Denied</div>}>
  <AdminOnlyContent />
</RoleGuard>

// Permission-based rendering
<PermissionGuard permission="employee.create">
  <CreateEmployeeButton />
</PermissionGuard>

// Multiple permissions (OR logic)
<PermissionGuard permission={['expense.approve', 'leave.approve']}>
  <ApprovalQueue />
</PermissionGuard>

// Multiple roles
<MultiRoleGuard roles={['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER']}>
  <SensitiveData />
</MultiRoleGuard>
```

## 🔄 Managing Roles

### Via API

```javascript
// Assign role to user
await api.post('/rbac/assign-role', {
  userId: 'user-uuid',
  roleName: 'HR_MANAGER'
});

// Remove role from user
await api.post('/rbac/remove-role', {
  userId: 'user-uuid',
  roleName: 'HR_STAFF'
});

// Get user's permissions
const response = await api.get('/rbac/my-permissions');
console.log(response.data.permissions); // Array of permission codes
console.log(response.data.roles); // Array of role objects
```

### Via UI

1. Navigate to **Role Management** page (admin only)
2. Click **Assign Role** next to a user
3. Select the role from dropdown
4. Click **Assign Role** button

To remove a role, click the ❌ on the role badge.

## 📊 Permission Categories

Permissions are organized by module:

- **System**: `system.manage`, `audit.view`
- **Users**: `user.create`, `user.view`, `user.update`, `user.delete`, `user.invite`
- **Employees**: `employee.create`, `employee.view.all`, `employee.manage`
- **Attendance**: `attendance.mark.own`, `attendance.view.all`, `attendance.approve`
- **Leave**: `leave.request`, `leave.approve`, `leave.types.manage`
- **Payroll**: `payroll.view.own`, `payroll.manage`, `payroll.process`
- **Finance**: `finance.dashboard`, `accounting.entry.create`
- **Expense**: `expense.claim`, `expense.approve`, `expenseCategory.create`
- **Inventory**: `inventory.create`, `inventory.approve`, `warehouse.manage`
- **Sales**: `sales.create`, `sales.approve`, `crm.customer.create`
- **CRM**: `crm.lead.create`, `crm.deal.update`, `crm.communication.create`
- **Purchase**: `purchase.create`, `purchase.approve`, `purchase.vendors.manage`
- **Projects**: `project.create`, `project.tasks.assign`, `project.tasks.update`
- **Documents**: `document.create`, `document.share`, `document.delete`
- **Reports**: `reports.view`, `reports.export`, `reports.financial.view`

## 🔒 Security Best Practices

1. **Always use permissions over roles** in route protection when possible
2. **Validate permissions on both frontend and backend**
3. **Never rely solely on frontend checks** - backend must enforce permissions
4. **Use specific permissions** rather than broad roles
5. **Regularly audit user permissions** using the Role Management UI
6. **Use `attachUserPermissions`** middleware for conditional controller logic

## 🐛 Troubleshooting

### Users Can't Access Features

1. Check user's assigned roles:
   ```javascript
   await api.get('/rbac/users/:userId/permissions');
   ```

2. Verify role has required permission:
   ```javascript
   await api.get('/rbac/roles');
   ```

3. Re-run setup if roles are missing:
   ```bash
   node setup-rbac.js
   ```

### Permission Denied Errors

- Check browser console for specific permission required
- Verify user has correct role assigned
- Check backend logs for permission check details

### Roles Not Appearing

- Run: `await api.post('/rbac/initialize')` (admin only)
- This re-seeds roles for your tenant

## 📈 Next Steps

1. **Customize Permissions**: Edit `/backend/src/core/rbac/permissions.config.js`
2. **Add New Roles**: Add to `ROLE_PERMISSIONS` in the config
3. **Create Custom Guards**: Extend the guard components for complex logic
4. **Audit Logging**: Use `audit.view` permission to track role changes
5. **Row-Level Security**: Implement data filtering based on user roles in queries

## 📞 Support

For issues or questions about RBAC:
- Check the permission config: `backend/src/core/rbac/permissions.config.js`
- Review middleware: `backend/src/core/rbac/permission.middleware.js`
- Check frontend hook: `frontend/src/hooks/useAuth.js`

---

**🎉 Your ERP system now has enterprise-grade access control!**
