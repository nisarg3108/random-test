# RBAC Quick Reference Card

## 🔧 Backend Patterns

### Route Protection

```javascript
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requirePermission, requireRole } from '../core/rbac/permission.middleware.js';

// ✅ Permission-based (Recommended)
router.post('/employees', 
  requireAuth, 
  requirePermission('employee.create'), 
  createEmployee
);

// ✅ Multiple permissions (OR logic - needs ANY)
router.get('/dashboard', 
  requireAuth,
  requirePermission(['hr.dashboard', 'manager.dashboard']),
  getDashboard
);

// ✅ Multiple permissions (AND logic - needs ALL)
router.post('/payroll/approve', 
  requireAuth,
  requirePermission(['payroll.process', 'payroll.approve'], { requireAll: true }),
  approvePayroll
);

// ✅ Role-based
router.get('/admin', requireAuth, requireRole('ADMIN'), adminOnly);
router.get('/reports', requireAuth, requireRole(['ADMIN', 'MANAGER']), getReports);
```

### Controller Logic

```javascript
import { attachUserPermissions } from '../core/rbac/permission.middleware.js';

// Attach permissions to request
router.get('/data', requireAuth, attachUserPermissions, async (req, res) => {
  const permissions = req.userPermissions; // Array of permission codes
  const roles = req.userRoles; // Array of role names
  
  // Conditional logic
  if (permissions.includes('data.export')) {
    // Include export data
  }
  
  // Filter data based on permissions
  const query = {};
  if (!permissions.includes('data.view.all')) {
    query.userId = req.user.userId; // Only show user's own data
  }
  
  const data = await prisma.data.findMany({ where: query });
  res.json(data);
});
```

## 🎨 Frontend Patterns

### Hook Usage

```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { 
    user,           // Current user object
    isAdmin,        // Boolean: is user admin?
    hasRole,        // Function: check role
    hasPermission,  // Function: check permission
    permissions,    // Array: all user permissions
    roles          // Array: all user roles
  } = useAuth();
  
  // Check single role
  if (hasRole('HR_MANAGER')) {
    // Show HR features
  }
  
  // Check single permission
  if (hasPermission('employee.create')) {
    // Show create button
  }
  
  // Check multiple permissions (OR - has ANY)
  if (hasPermission(['expense.approve', 'leave.approve'])) {
    // Show approval queue
  }
  
  // Check multiple roles
  if (hasAnyRole(['ADMIN', 'MANAGER'])) {
    // Show management features
  }
  
  return <div>Content</div>;
}
```

### Guard Components

```javascript
import { RoleGuard, PermissionGuard, MultiRoleGuard } from '../hooks/useAuth';

function Dashboard() {
  return (
    <div>
      {/* ✅ Show only to admins */}
      <RoleGuard requiredRole="ADMIN">
        <AdminPanel />
      </RoleGuard>
      
      {/* ✅ Show only with permission */}
      <PermissionGuard permission="employee.create">
        <CreateEmployeeButton />
      </PermissionGuard>
      
      {/* ✅ Show with ANY permission */}
      <PermissionGuard permission={['expense.approve', 'leave.approve']}>
        <ApprovalQueue />
      </PermissionGuard>
      
      {/* ✅ Show with ALL permissions */}
      <PermissionGuard 
        permission={['payroll.view.all', 'payroll.process']} 
        requireAll={true}
      >
        <PayrollProcessing />
      </PermissionGuard>
      
      {/* ✅ Show to multiple roles */}
      <MultiRoleGuard roles={['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER']}>
        <SensitiveReports />
      </MultiRoleGuard>
      
      {/* ✅ With fallback */}
      <PermissionGuard 
        permission="reports.financial.view"
        fallback={<div>Access Denied</div>}
      >
        <FinancialReports />
      </PermissionGuard>
    </div>
  );
}
```

### Conditional Rendering

```javascript
function EmployeeList() {
  const { hasPermission } = useAuth();
  
  return (
    <div>
      {/* ✅ Conditional button */}
      {hasPermission('employee.create') && (
        <button onClick={createEmployee}>Create Employee</button>
      )}
      
      {/* ✅ Conditional table columns */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            {hasPermission('employee.salary.view') && <th>Salary</th>}
            {hasPermission('employee.update') && <th>Actions</th>}
          </tr>
        </thead>
      </table>
    </div>
  );
}
```

## 🎯 Common Permission Patterns

### Module Access
```javascript
// View module
hasPermission('inventory.view')

// Create in module
hasPermission('inventory.create')

// Update in module
hasPermission('inventory.update')

// Delete from module
hasPermission('inventory.delete')

// Approve in module
hasPermission('inventory.approve')
```

### Data Scope
```javascript
// View own data
hasPermission('expense.view.own')

// View all data
hasPermission('expense.view.all')

// Manage own
hasPermission('leave.request')

// Manage all
hasPermission('leave.manage')
```

### Dashboard Access
```javascript
// Department dashboard
hasPermission('hr.dashboard')
hasPermission('finance.dashboard')

// Manager dashboard
hasPermission('manager.dashboard')

// Analytics
hasPermission('reports.hr.view')
```

## 🔍 Permission Categories Reference

| Category | Example Permissions |
|----------|---------------------|
| **System** | `system.manage`, `audit.view` |
| **Users** | `user.create`, `user.invite`, `user.assign.roles` |
| **Employees** | `employee.create`, `employee.view.all`, `employee.manage` |
| **Attendance** | `attendance.mark.own`, `attendance.approve` |
| **Leave** | `leave.request`, `leave.approve`, `leave.types.manage` |
| **Payroll** | `payroll.view.own`, `payroll.process`, `payroll.approve` |
| **Finance** | `finance.dashboard`, `accounting.entry.create` |
| **Expense** | `expense.claim`, `expense.approve` |
| **Inventory** | `inventory.create`, `inventory.approve`, `warehouse.manage` |
| **Sales** | `sales.create`, `crm.lead.create`, `crm.deal.update` |
| **Purchase** | `purchase.create`, `purchase.approve` |
| **Projects** | `project.create`, `project.tasks.assign` |
| **Documents** | `document.create`, `document.share` |
| **Reports** | `reports.view`, `reports.export`, `reports.financial.view` |

## 🎭 Role Hierarchy (for reference)

```
ADMIN (Level 10)
  ├─ HR_MANAGER (Level 8)
  ├─ FINANCE_MANAGER (Level 8)
  ├─ INVENTORY_MANAGER (Level 8)
  ├─ SALES_MANAGER (Level 8)
  ├─ PURCHASE_MANAGER (Level 8)
  └─ PROJECT_MANAGER (Level 7)
      └─ MANAGER (Level 6)
          ├─ HR_STAFF (Level 5)
          ├─ ACCOUNTANT (Level 5)
          ├─ WAREHOUSE_STAFF (Level 4)
          └─ SALES_STAFF (Level 4)
              └─ EMPLOYEE (Level 3)
                  └─ USER (Level 1)
```

## 📋 API Endpoints

```javascript
// Get all roles
GET /api/rbac/roles

// Get all permissions
GET /api/rbac/permissions

// Get my permissions
GET /api/rbac/my-permissions

// Get user permissions
GET /api/rbac/users/:userId/permissions

// Get all users with roles
GET /api/rbac/users

// Assign role (admin only)
POST /api/rbac/assign-role
Body: { userId, roleName }

// Remove role (admin only)
POST /api/rbac/remove-role
Body: { userId, roleName }

// Initialize roles (admin only)
POST /api/rbac/initialize
```

## ⚡ Best Practices

### ✅ DO
- Use permissions for route protection (more granular)
- Check permissions on both frontend and backend
- Use specific permissions (`employee.create` not `employee.manage`)
- Provide fallback UI for denied access
- Admin bypasses all checks automatically

### ❌ DON'T
- Don't rely only on frontend checks
- Don't use roles when permissions are more appropriate
- Don't check permissions without requireAuth
- Don't hardcode role names everywhere
- Don't forget to handle loading states

## 🔧 Quick Debugging

```javascript
// Check user's current permissions
const { permissions, roles } = useAuth();
console.log('Permissions:', permissions);
console.log('Roles:', roles);

// In API response
console.log('API Error:', error.response.data.required); // Shows required permission

// Backend logs
// Permission middleware logs denied access with details
```

---

**Pro Tip:** Start with role-based checks, then move to permission-based for fine-grained control.
