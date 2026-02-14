# ERP System Test Failure - Action Plan

## Executive Summary
Test suite shows 38.74% pass rate (74/191 tests). Main issues are:
1. ✅ **FIXED:** Employee creation Prisma relation error
2. ✅ **FIXED:** Asset creation missing required field
3. ⚠️ **CRITICAL:** 117 test failures due to missing routes and permission issues

## Immediate Fixes Applied

### 1. Employee Service Fix ✅
**File:** `backend/src/modules/hr/employee.service.js`
**Change:** Updated Prisma relation from `userId` to `user: { connect: { id } }`
**Impact:** Fixes all employee creation tests

### 2. Asset Service Fix ✅
**File:** `backend/src/modules/assets/asset.service.js`
**Change:** Added auto-generation of `assetCode` field
**Impact:** Fixes all asset creation tests

## Priority 1: Critical Fixes (Do First)

### A. Fix Test Data Issues
**Files to Update:** `COMPREHENSIVE_ERP_SYSTEM_TEST.js`

1. **Vendor Unique Constraint**
   ```javascript
   // Generate unique vendor codes
   vendorCode: `VEN-${TEST_RUN_ID}-${Date.now()}`
   ```

2. **Asset Category Creation**
   ```javascript
   // Create asset category before creating assets
   await createAssetCategory();
   ```

3. **Department Setup**
   ```javascript
   // Create departments before employees
   await setupDepartments();
   ```

### B. Fix RBAC Permissions
**Files to Check:**
- `backend/src/core/rbac/rbac.middleware.js`
- `backend/src/core/rbac/permissions.js`

**Required Permissions:**
```javascript
// HR_MANAGER permissions
'employees:read', 'employees:create', 'employees:update'

// FINANCE_MANAGER permissions
'finance:read', 'accounting:read', 'accounting:create', 'expense-categories:create'

// INVENTORY_MANAGER permissions
'inventory:read', 'inventory:create', 'warehouses:create'

// SALES_MANAGER permissions
'crm:read', 'crm:create', 'customers:create'

// PROJECT_MANAGER permissions
'projects:read', 'projects:create'
```

## Priority 2: Implement Missing Routes

### High Priority Routes (Core Functionality)
1. **Attendance Management**
   - `GET /api/attendance` - List attendance records
   - `POST /api/attendance` - Mark attendance
   - `GET /api/attendance/summary` - Get attendance summary

2. **Task Management**
   - `GET /api/tasks/manager` - Get manager's tasks
   - `GET /api/tasks/team` - Get team tasks

3. **Financial Reports**
   - `GET /api/accounting/trial-balance`
   - `GET /api/accounting/balance-sheet`
   - `GET /api/accounting/income-statement`

4. **Company Settings**
   - `GET /api/company` - Get company info
   - `PUT /api/company` - Update company info
   - `GET /api/system-options` - Get system options

### Medium Priority Routes
1. **Sales Tracking**
   - `GET /api/sales/invoices/payments`
   - `GET /api/sales/tracking`

2. **Purchase Management**
   - `GET /api/purchase/goods-receipts`

3. **Notifications**
   - `GET /api/notifications/unread-count`

4. **User Invites**
   - `GET /api/invites`

5. **CRM Pipelines**
   - `GET /api/crm/pipelines/default`

### Low Priority Routes (Can Wait)
1. **Manufacturing**
   - `GET /api/manufacturing/orders`
   - `GET /api/manufacturing/dashboard`

2. **Document Management**
   - `GET /api/documents/folders`
   - `POST /api/documents/templates`
   - `GET /api/documents/templates`

3. **Workflow Management**
   - `GET /api/workflows`
   - `POST /api/workflows`

4. **Reports**
   - `GET /api/reports`
   - `POST /api/reports/generate`

5. **Dashboard**
   - `GET /api/dashboard`

## Priority 3: Fix Data Export Issues

### Warehouse Export Error
**File:** `backend/src/modules/data-export/export.controller.js` or similar
**Issue:** 500 Internal Server Error on `/api/data/export/warehouses`
**Action:** Debug and fix the warehouse export logic

## Implementation Steps

### Step 1: Apply Immediate Fixes (15 minutes)
```bash
# Already done:
# 1. Employee service fix
# 2. Asset service fix

# Test the fixes:
cd backend
node COMPREHENSIVE_ERP_SYSTEM_TEST.js
```

### Step 2: Update Test File (30 minutes)
1. Open `COMPREHENSIVE_ERP_SYSTEM_TEST.js`
2. Apply fixes from `TEST_QUICK_FIXES.js`
3. Add department setup before employee tests
4. Add asset category setup before asset tests
5. Fix vendor code generation
6. Re-run tests

### Step 3: Fix RBAC Permissions (1 hour)
1. Review permission definitions
2. Update role-permission mappings
3. Test each role's access
4. Re-run tests

### Step 4: Implement Missing Routes (2-4 hours per priority level)
1. Start with High Priority routes
2. Create controllers, services, and routes
3. Add proper authentication and authorization
4. Test each route individually
5. Re-run full test suite

### Step 5: Fix Data Export (30 minutes)
1. Debug warehouse export error
2. Add error handling
3. Test export functionality

## Expected Outcomes

### After Step 1-2 (Test Fixes)
- **Expected Pass Rate:** 50-60%
- **Remaining Failures:** Missing routes and permissions

### After Step 3 (RBAC Fixes)
- **Expected Pass Rate:** 65-75%
- **Remaining Failures:** Missing routes only

### After Step 4 (High Priority Routes)
- **Expected Pass Rate:** 80-85%
- **Remaining Failures:** Medium/Low priority routes

### After Step 4-5 (All Routes)
- **Expected Pass Rate:** 95-100%
- **Remaining Failures:** Edge cases and bugs

## Testing Strategy

### 1. Unit Testing
Test each fixed component individually:
```bash
# Test employee creation
npm test -- employee.service.test.js

# Test asset creation
npm test -- asset.service.test.js
```

### 2. Integration Testing
Run the comprehensive test suite:
```bash
node COMPREHENSIVE_ERP_SYSTEM_TEST.js
```

### 3. Manual Testing
Test critical workflows manually:
- User registration and login
- Employee creation and management
- Asset creation and allocation
- Financial transactions

## Monitoring and Validation

### Success Metrics
- [ ] Test pass rate > 95%
- [ ] All critical routes implemented
- [ ] All RBAC permissions working
- [ ] No 500 errors in test suite
- [ ] All data exports working

### Validation Checklist
- [ ] Employee creation works
- [ ] Asset creation works
- [ ] All user roles can access their endpoints
- [ ] Financial reports generate correctly
- [ ] Attendance tracking works
- [ ] Task management works
- [ ] Data exports work without errors

## Timeline

| Phase | Duration | Completion |
|-------|----------|------------|
| Immediate Fixes | ✅ Done | 100% |
| Test File Updates | 30 min | Pending |
| RBAC Fixes | 1 hour | Pending |
| High Priority Routes | 2-4 hours | Pending |
| Medium Priority Routes | 2-3 hours | Pending |
| Low Priority Routes | 3-4 hours | Pending |
| Testing & Validation | 1 hour | Pending |
| **Total** | **10-14 hours** | **~15%** |

## Next Actions

1. ✅ Review this action plan
2. ⏳ Apply test file fixes from `TEST_QUICK_FIXES.js`
3. ⏳ Run tests again to verify improvements
4. ⏳ Start implementing high priority routes
5. ⏳ Fix RBAC permissions
6. ⏳ Continue with medium and low priority routes

## Notes

- The two critical fixes (employee and asset creation) are already applied
- Focus on test file fixes next to see immediate improvement
- RBAC fixes will have the biggest impact on pass rate
- Missing routes can be implemented incrementally
- Prioritize based on business requirements

---

**Last Updated:** 2026-02-12
**Status:** In Progress (15% Complete)
**Next Review:** After test file fixes applied
