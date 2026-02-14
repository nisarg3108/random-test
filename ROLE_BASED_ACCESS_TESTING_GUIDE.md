# 🧪 Role-Based Access Control - Testing Guide

## ✅ Test Environment Ready

**Frontend:** http://localhost:5174  
**Backend:** http://localhost:5000  
**Total Users:** 16 users covering all 14 roles  
**Dashboard Coverage:** 100%

---

## 🔑 Test User Credentials

All test users have the password: **Test@123**

### Test Users by Role:

| Role | Email | Password |
|------|-------|----------|
| **ADMIN** | apitest@test.com | Test@123 |
| **ADMIN** | bhavsarnisarg0@gmail.com | Test@123 |
| **MANAGER** | pri@gmail.com | Test@123 |
| **MANAGER** | jeet@gmail.com | Test@123 |
| **HR_MANAGER** | mit@gmail.com | Test@123 |
| **HR_STAFF** | hr.staff@test.com | Test@123 |
| **FINANCE_MANAGER** | finance.manager@test.com | Test@123 |
| **ACCOUNTANT** | accountant@test.com | Test@123 |
| **INVENTORY_MANAGER** | inventory.manager@test.com | Test@123 |
| **WAREHOUSE_STAFF** | warehouse.staff@test.com | Test@123 |
| **SALES_MANAGER** | sales.manager@test.com | Test@123 |
| **SALES_STAFF** | sales.staff@test.com | Test@123 |
| **PURCHASE_MANAGER** | purchase.manager@test.com | Test@123 |
| **PROJECT_MANAGER** | project.manager@test.com | Test@123 |
| **EMPLOYEE** | het@gmail.com | Test@123 |
| **USER** | user@test.com | Test@123 |

---

## 📋 TEST 1: Login with Different Role Users

### Instructions:
1. Open http://localhost:5174 in your browser
2. Log out if already logged in
3. Test login for each role below

### Expected Results:

#### ✅ Test 1.1: ADMIN Login
- **Email:** apitest@test.com
- **Password:** Test@123
- **Expected:** Successfully logs in, redirects to /dashboard
- **Expected:** Shows "ADMIN" badge in sidebar

#### ✅ Test 1.2: HR_MANAGER Login
- **Email:** mit@gmail.com
- **Password:** Test@123
- **Expected:** Successfully logs in, redirects to /dashboard
- **Expected:** Shows "HR_MANAGER" badge in sidebar

#### ✅ Test 1.3: FINANCE_MANAGER Login
- **Email:** finance.manager@test.com
- **Password:** Test@123
- **Expected:** Successfully logs in, redirects to /dashboard
- **Expected:** Shows "FINANCE_MANAGER" badge in sidebar

#### ✅ Test 1.4: SALES_STAFF Login
- **Email:** sales.staff@test.com
- **Password:** Test@123
- **Expected:** Successfully logs in, redirects to /dashboard
- **Expected:** Shows "SALES_STAFF" badge in sidebar

#### ✅ Test 1.5: EMPLOYEE Login
- **Email:** het@gmail.com
- **Password:** Test@123
- **Expected:** Successfully logs in, redirects to /dashboard
- **Expected:** Shows "EMPLOYEE" badge in sidebar

---

## 📋 TEST 2: Verify Each Role Sees Their Specific Dashboard

### Instructions:
After logging in with each user, verify the dashboard content matches the role.

### Expected Dashboard Content by Role:

#### ✅ Test 2.1: ADMIN Dashboard
- **Title:** "Admin Dashboard"
- **Stats:** Total Users, Employees, Inventory Items, Departments
- **Widgets:** Approval Widget, Overdue Allocation Widget, Recent Activities
- **Actions:** Add User, System Settings

#### ✅ Test 2.2: HR_MANAGER Dashboard
- **Title:** "HR Manager Dashboard"
- **Stats:** Total Employees, Active Employees, Pending Leaves, Active Recruitment
- **Widgets:** Pending Approvals, Recent Activities
- **Actions:** Add Employee, Process Payroll

#### ✅ Test 2.3: FINANCE_MANAGER Dashboard
- **Title:** "Finance Manager Dashboard"
- **Stats:** Total Revenue, Total Expenses, Net Profit, Pending Invoices
- **Widgets:** Pending Approvals, Quick Actions
- **Actions:** New Entry, Reports

#### ✅ Test 2.4: ACCOUNTANT Dashboard
- **Title:** "Accountant Dashboard"
- **Stats:** Pending Entries, Today's Entries, Accounts Unbalanced
- **Actions:** New Journal Entry, Ledger, Chart of Accounts

#### ✅ Test 2.5: INVENTORY_MANAGER Dashboard
- **Title:** "Inventory Manager Dashboard"
- **Stats:** Total Items, Low Stock, Out of Stock, In Transit
- **Widgets:** Inventory Alerts
- **Actions:** Add Item, New Order

#### ✅ Test 2.6: WAREHOUSE_STAFF Dashboard
- **Title:** "Warehouse Staff Dashboard"
- **Stats:** Today Receipts, Today Dispatch, Pending Picks, My Tasks
- **Actions:** View Inventory, Receipts, Dispatch

#### ✅ Test 2.7: SALES_MANAGER Dashboard
- **Title:** "Sales Manager Dashboard"
- **Stats:** Total Sales, Active Pipeline, Won Deals, Team Performance
- **Widgets:** Sales Pipeline breakdown
- **Actions:** Add Customer, New Sale

#### ✅ Test 2.8: SALES_STAFF Dashboard
- **Title:** "Sales Staff Dashboard"
- **Stats:** My Leads, Active Deals, Closed Deals, Today Followups
- **Actions:** Add Lead, View Customers

#### ✅ Test 2.9: PURCHASE_MANAGER Dashboard
- **Title:** "Purchase Manager Dashboard"
- **Stats:** Total Orders, Pending Approvals, Active Vendors
- **Widgets:** Pending Approvals
- **Actions:** Add Vendor, New PO

#### ✅ Test 2.10: PROJECT_MANAGER Dashboard
- **Title:** "Project Manager Dashboard"
- **Stats:** Active Projects, Total Tasks, Completed Tasks, Overdue Tasks
- **Widgets:** Active Projects list
- **Actions:** New Project, New Task

#### ✅ Test 2.11: EMPLOYEE Dashboard
- **Title:** "Employee Dashboard"
- **Stats:** Leave Balance, My Tasks, Attendance Rate, Upcoming Leaves
- **Widgets:** Recent Notifications, Profile Summary
- **Actions:** Apply Leave, View Tasks

#### ✅ Test 2.12: USER Dashboard
- **Title:** "User Dashboard" (basic dashboard)
- **Stats:** Basic user statistics
- **Actions:** Standard user actions

---

## 📋 TEST 3: Check Sidebar Menu Items Are Filtered by Role Permissions

### Instructions:
For each user login, verify which menu items are visible in the sidebar.

### Expected Sidebar Visibility by Role:

#### ✅ Test 3.1: ADMIN User
**Should See:**
- ✅ All menu items (full access)
- ✅ Dashboard
- ✅ Inventory
- ✅ HR sections
- ✅ Finance sections
- ✅ Users & User Management
- ✅ Role Management (ADMIN only)
- ✅ Roles & Permissions (ADMIN only)
- ✅ Company Settings
- ✅ System Options

#### ✅ Test 3.2: HR_MANAGER User
**Should See:**
- ✅ Dashboard
- ✅ Inventory
- ✅ HR Dashboard
- ✅ Employees
- ✅ Salary Management
- ✅ Leave Requests
- ✅ Payroll sections
- ✅ Users (Manager level)
- ❌ Role Management (ADMIN only)
- ❌ Company Settings (ADMIN only)

#### ✅ Test 3.3: FINANCE_MANAGER User
**Should See:**
- ✅ Dashboard
- ✅ Finance Dashboard
- ✅ Expense Categories
- ✅ Expense Claims
- ✅ Finance Approvals
- ✅ Accounting sections
- ❌ Role Management
- ❌ HR Management

#### ✅ Test 3.4: ACCOUNTANT User
**Should See:**
- ✅ Dashboard
- ✅ Inventory (USER level)
- ✅ Basic accounting features
- ❌ Finance Management
- ❌ User Management
- ❌ Role Management

#### ✅ Test 3.5: SALES_STAFF User
**Should See:**
- ✅ Dashboard
- ✅ CRM sections
- ✅ Sales Orders
- ✅ Customers & Contacts
- ❌ Sales approvals/management
- ❌ User Management
- ❌ Finance sections

#### ✅ Test 3.6: EMPLOYEE User
**Should See:**
- ✅ Dashboard
- ✅ My Dashboard (EMPLOYEE specific)
- ✅ Basic inventory view
- ✅ Work Reports (EMPLOYEE specific)
- ✅ Attendance & Leave
- ❌ Management features
- ❌ User Management
- ❌ Admin features

#### ✅ Test 3.7: USER (Basic User)
**Should See:**
- ✅ Dashboard
- ✅ Inventory (view only)
- ✅ Basic features
- ❌ Management features
- ❌ Admin features
- ❌ User Management

### Verification Method:
1. Log in with each user
2. Count visible sidebar menu items
3. Verify ADMIN sees ~80 items
4. Verify EMPLOYEE sees ~15 items
5. Verify USER sees ~10 items
6. Check that admin-only items (Role Management, System) are hidden for non-admins

---

## 📋 TEST 4: Test Navigation Between Modules

### Instructions:
For each logged-in user, test clicking on available sidebar menu items.

### Expected Navigation Results:

#### ✅ Test 4.1: ADMIN Navigation
1. Click "Dashboard" → Should navigate to AdminDashboard
2. Click "Role Management" → Should load Role Management page
3. Click "Users" → Should load Users list
4. Click "Inventory" → Should load Inventory list
5. Click "HR Dashboard" → Should load HR page
6. Click "Finance Dashboard" → Should load Finance page
7. Click "Company" → Should load Company settings
8. **Expected:** All links work correctly, no 403/404 errors

#### ✅ Test 4.2: HR_MANAGER Navigation
1. Click "Dashboard" → Should load HRManagerDashboard
2. Click "Employees" → Should load Employee list
3. Click "Leave Requests" → Should load Leave requests
4. Click "Payroll" → Should load Payroll page
5. Try to access "/role-management" directly → Should redirect or show error
6. **Expected:** HR sections work, admin sections blocked

#### ✅ Test 4.3: FINANCE_MANAGER Navigation
1. Click "Dashboard" → Should load FinanceManagerDashboard
2. Click "Finance Dashboard" → Should load Finance page
3. Click "Expense Claims" → Should load Expense claims
4. Click "Approvals" → Should load approval list
5. Try to access "/users" → Should work (manager level)
6. **Expected:** Finance sections work, proper access control

#### ✅ Test 4.4: SALES_STAFF Navigation
1. Click "Dashboard" → Should load SalesStaffDashboard
2. Click "CRM Customers" → Should load customer list
3. Click "CRM Leads" → Should load leads list
4. Click "Sales Orders" → Should load orders
5. Try to access "/users" → Should be blocked or redirect
6. **Expected:** CRM/Sales sections work, management features blocked

#### ✅ Test 4.5: EMPLOYEE Navigation
1. Click "Dashboard" → Should load EmployeeDashboard
2. Click "My Dashboard" → Should load employee portal
3. Click "Work Reports" → Should load work reports
4. Click "Attendance & Time" → Should load attendance
5. Try to access "/hr" → Should be blocked
6. **Expected:** Self-service features work, management blocked

### Additional Navigation Tests:
- Test browser back/forward buttons
- Test deep linking (paste URL directly)
- Test refresh on each page
- Verify proper redirects on unauthorized access

---

## 📊 Test Results Template

### TEST 1: Login Results
| Role | Login Success | Dashboard Loads | Badge Shows Correctly |
|------|--------------|-----------------|---------------------|
| ADMIN | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| HR_MANAGER | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| FINANCE_MANAGER | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| SALES_STAFF | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| EMPLOYEE | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |

### TEST 2: Dashboard Verification
| Role | Correct Dashboard | Correct Title | Correct Stats | Correct Actions |
|------|------------------|---------------|---------------|----------------|
| ADMIN | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| HR_MANAGER | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| FINANCE_MANAGER | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |

### TEST 3: Sidebar Filtering
| Role | Menu Count Correct | Admin Items Hidden | Role Items Visible |
|------|-------------------|-------------------|-------------------|
| ADMIN | ⬜ Pass / ⬜ Fail | N/A | ⬜ Pass / ⬜ Fail |
| EMPLOYEE | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| USER | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |

### TEST 4: Navigation
| Role | All Links Work | Access Control Works | No Errors |
|------|---------------|---------------------|-----------|
| ADMIN | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| HR_MANAGER | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |
| SALES_STAFF | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail | ⬜ Pass / ⬜ Fail |

---

## 🐛 Common Issues to Check

1. **Login Issues:**
   - Clear browser cache/cookies
   - Check network tab for API errors
   - Verify backend is running on port 5000

2. **Dashboard Not Loading:**
   - Check browser console for errors
   - Verify dashboard component exists for the role
   - Check Dashboard.jsx routing logic

3. **Sidebar Items Not Filtered:**
   - Check hasRole() function in useAuth
   - Verify permission context is loaded
   - Check sidebar filtering logic

4. **Navigation Errors:**
   - Verify routes are defined in App.jsx
   - Check protected route middleware
   - Verify component imports

---

## ✅ Final Checklist

- [ ] All 16 test users can log in successfully
- [ ] Each role sees their specific dashboard
- [ ] Dashboard titles match role names
- [ ] Sidebar menu items are role-appropriate
- [ ] Admin-only items hidden for non-admins
- [ ] All navigation links work correctly
- [ ] No console errors on any page
- [ ] Proper redirects on unauthorized access
- [ ] Role badges display correctly in sidebar
- [ ] Logout works from all roles

---

## 📝 Notes

- **Backend Test Script:** `node backend/test-role-access.js`
- **Create Users Script:** `node backend/create-test-users.js`
- **Fix RBAC Script:** `node backend/fix-rbac.js`

**Test Coverage:** 100% of all 14 roles  
**Total Test Users:** 16  
**Estimated Test Time:** 30-45 minutes for complete testing

---

**Good luck with testing! 🚀**
