# 🔍 ERP System - Comprehensive Module Testing Guide

## Testing Priority Order
1. ✅ Authentication & RBAC (Most Critical)
2. Employee Management
3. Attendance System
4. Payroll System
5. Finance Management
6. Asset Management
7. Document Management
8. Communication Module
9. Sales Module
10. Project Management

---

## 📋 Module 1: Authentication & RBAC

### Backend Components
- [ ] Auth routes (`/api/auth/register`, `/api/auth/login`)
- [ ] RBAC routes (`/api/rbac/*`)
- [ ] Auth middleware (`requireAuth`)
- [ ] Permission middleware (`requirePermission`, `requireRole`)
- [ ] JWT token generation and validation

### Frontend Components
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Auth context/store
- [ ] Protected route guards

### Test Cases
1. **Registration**
   - [ ] Register new company/tenant with admin user
   - [ ] Verify tenant created in database
   - [ ] Verify admin user created with ADMIN role
   - [ ] Verify JWT token returned
   - [ ] Test duplicate email rejection

2. **Login**
   - [ ] Login with correct credentials
   - [ ] Verify JWT token returned
   - [ ] Test wrong password rejection
   - [ ] Test non-existent user rejection

3. **Protected Routes**
   - [ ] Access protected route with valid token
   - [ ] Reject access without token (401)
   - [ ] Reject access with invalid token (401)
   - [ ] Reject access with expired token (401)

4. **Role-Based Access**
   - [ ] Admin can access `/api/admin`
   - [ ] Non-admin cannot access admin routes (403)
   - [ ] Role middleware works correctly

5. **Permission-Based Access**
   - [ ] GET `/api/rbac/roles` - List all roles
   - [ ] GET `/api/rbac/permissions` - List all permissions
   - [ ] GET `/api/rbac/my-permissions` - Get current user permissions
   - [ ] GET `/api/rbac/users` - List users with roles
   - [ ] POST `/api/rbac/assign-role` - Assign role to user
   - [ ] POST `/api/rbac/remove-role` - Remove role from user

6. **RBAC Seeding**
   - [ ] Verify permissions seeded (123 permissions)
   - [ ] Verify roles created (14 roles)
   - [ ] Verify role-permission mappings

### Known Issues
- ⚠️ Backend server starting but not listening on port 5000
- ⚠️ Tenant showing as "undefined" during seeding (cosmetic issue)

### How to Test Manually

```powershell
# Start backend
cd backend
npm run dev

# Test health endpoint
curl http://localhost:5000/api/health

# Test registration
$body = @{
    companyName = "Test Company"
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method POST -Body $body -ContentType "application/json"

# Test login
$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.token

# Test protected route
$headers = @{
    Authorization = "Bearer $token"
}
Invoke-RestMethod -Uri http://localhost:5000/api/protected -Headers $headers

# Test get roles
Invoke-RestMethod -Uri http://localhost:5000/api/rbac/roles -Headers $headers

# Test get permissions
Invoke-RestMethod -Uri http://localhost:5000/api/rbac/permissions -Headers $headers

# Test my permissions
Invoke-RestMethod -Uri http://localhost:5000/api/rbac/my-permissions -Headers $headers
```

---

## 📋 Module 2: Employee Management

### Backend Components
- [ ] Employee routes (`/api/employees/*`)
- [ ] Employee controller
- [ ] Employee-user integration
- [ ] Department management

### Frontend Components
- [ ] Employee list page
- [ ] Employee create/edit form
- [ ] Employee profile page
- [ ] Employee dashboard

### Test Cases
1. **Employee CRUD**
   - [ ] Create new employee
   - [ ] Link employee to user account
   - [ ] List all employees (with pagination)
   - [ ] Get employee by ID
   - [ ] Update employee details
   - [ ] Deactivate/delete employee

2. **Employee-User Integration**
   - [ ] Create user when creating employee
   - [ ] Assign role to employee user
   - [ ] Employee can login with user credentials
   - [ ] Employee dashboard shows correct data

3. **Permissions**
   - [ ] `employee.create` - Create employee
   - [ ] `employee.view` - View own employee data
   - [ ] `employee.view.all` - View all employees
   - [ ] `employee.update` - Update employee
   - [ ] `employee.delete` - Delete employee

### Manual Test Commands
```powershell
# Create employee
$employee = @{
    firstName = "John"
    lastName = "Doe"
    email = "john.doe@test.com"
    departmentId = "<department-id>"
    position = "Software Developer"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/employees -Method POST -Body $employee -Headers $headers -ContentType "application/json"

# List employees
Invoke-RestMethod -Uri http://localhost:5000/api/employees -Headers $headers

# Get employee by ID
Invoke-RestMethod -Uri http://localhost:5000/api/employees/<employee-id> -Headers $headers
```

---

## 📋 Module 3: Attendance System

### Backend Components
- [ ] Attendance routes (`/api/attendance/*`)
- [ ] Clock in/out functionality
- [ ] Shift management
- [ ] Leave management
- [ ] Attendance reports

### Frontend Components
- [ ] Clock in/out interface
- [ ] Attendance calendar
- [ ] Leave request form
- [ ] Attendance reports

### Test Cases
1. **Clock In/Out**
   - [ ] Employee clocks in
   - [ ] Get clock status
   - [ ] Employee clocks out
   - [ ] Verify work hours calculated
   - [ ] Cannot clock in twice without clock out

2. **Shift Management**
   - [ ] Create shift
   - [ ] Assign shift to employee
   - [ ] Get employee shifts
   - [ ] Update shift
   - [ ] Delete shift

3. **Leave Requests**
   - [ ] Create leave request
   - [ ] List leave requests
   - [ ] Approve/reject leave request
   - [ ] Check leave balance

4. **Reports**
   - [ ] Get attendance summary
   - [ ] Get attendance by date range
   - [ ] Export attendance data

### Manual Test Commands
```powershell
# Clock in
Invoke-RestMethod -Uri http://localhost:5000/api/attendance/clock-in -Method POST -Headers $headers

# Get clock status
Invoke-RestMethod -Uri http://localhost:5000/api/attendance/clock-status/<employee-id> -Headers $headers

# Clock out
Invoke-RestMethod -Uri http://localhost:5000/api/attendance/clock-out -Method POST -Headers $headers
```

---

## 📋 Module 4: Payroll System

### Backend Components
- [ ] Payroll routes (`/api/payroll/*`)
- [ ] Salary components
- [ ] Tax configuration
- [ ] Payroll cycles
- [ ] Payslip generation

### Test Cases
1. **Salary Components**
   - [ ] Create salary component (basic, allowance, deduction)
   - [ ] List salary components
   - [ ] Update salary component
   - [ ] Delete salary component

2. **Payroll Processing**
   - [ ] Create payroll cycle
   - [ ] Generate payslips for all employees
   - [ ] Calculate tax deductions
   - [ ] Process disbursements
   - [ ] View payslip details

3. **Reports**
   - [ ] Payroll summary report
   - [ ] Individual payslip
   - [ ] Tax report

---

## 📋 Module 5: Finance Management

### Backend Components
- [ ] Finance routes (`/api/finance/*`)
- [ ] Expense management
- [ ] Invoice management
- [ ] Budget tracking
- [ ] Approval workflows

### Test Cases
1. **Expenses**
   - [ ] Create expense category
   - [ ] Create expense claim
   - [ ] Submit for approval
   - [ ] Approve/reject expense
   - [ ] List expenses with filters

2. **Invoices**
   - [ ] Create invoice
   - [ ] Send invoice
   - [ ] Record payment
   - [ ] List invoices
   - [ ] Generate invoice report

3. **Budgets**
   - [ ] Create budget
   - [ ] Track spending against budget
   - [ ] Budget alerts
   - [ ] Budget reports

---

## 📋 Module 6: Asset Management

### Backend Components
- [ ] Asset routes (`/api/assets/*`)
- [ ] Asset allocation
- [ ] Maintenance tracking
- [ ] Depreciation calculation

### Test Cases
1. **Asset CRUD**
   - [ ] Create asset with category
   - [ ] List assets
   - [ ] Update asset
   - [ ] Depreciate asset
   - [ ] Dispose asset

2. **Allocation**
   - [ ] Allocate asset to employee
   - [ ] Return asset
   - [ ] View allocation history

3. **Maintenance**
   - [ ] Schedule maintenance
   - [ ] Record maintenance
   - [ ] Maintenance alerts
   - [ ] Maintenance history

---

## 📋 Module 7: Document Management

### Backend Components
- [ ] Document routes (`/api/documents/*`)
- [ ] File upload (multer)
- [ ] Document categorization
- [ ] Version control
- [ ] Access permissions

### Test Cases
1. **Document Upload**
   - [ ] Upload document
   - [ ] Set category and tags
   - [ ] Set access permissions
   - [ ] View document

2. **Version Control**
   - [ ] Upload new version
   - [ ] View version history
   - [ ] Revert to previous version

3. **Search & Filter**
   - [ ] Search by title
   - [ ] Filter by category
   - [ ] Filter by tags
   - [ ] Filter by date

---

## 📋 Module 8: Communication Module

### Backend Components
- [ ] Communication routes (`/api/communication/*`)
- [ ] Announcements
- [ ] Messaging
- [ ] Notifications
- [ ] WebSocket for real-time updates

### Test Cases
1. **Announcements**
   - [ ] Create announcement
   - [ ] List announcements
   - [ ] Mark as read
   - [ ] Delete announcement

2. **Messaging**
   - [ ] Send message
   - [ ] Receive message (real-time)
   - [ ] Message history
   - [ ] Read receipts

3. **Notifications**
   - [ ] Trigger notification
   - [ ] Receive notification (real-time)
   - [ ] Mark as read
   - [ ] Notification preferences

---

## 📋 Module 9: Sales Module

### Backend Components
- [ ] Sales routes (`/api/sales/*`)
- [ ] Lead management
- [ ] Opportunity tracking
- [ ] Quote generation
- [ ] Order processing

### Test Cases
1. **Leads**
   - [ ] Create lead
   - [ ] Convert lead to opportunity
   - [ ] List leads
   - [ ] Update lead status

2. **Opportunities**
   - [ ] Create opportunity
   - [ ] Track stages
   - [ ] Convert to quote/order
   - [ ] Pipeline view

3. **Quotes & Orders**
   - [ ] Generate quote
   - [ ] Convert quote to order
   - [ ] Process order
   - [ ] Invoice generation

---

## 📋 Module 10: Project Management

### Backend Components
- [ ] Project routes (`/api/projects/*`)
- [ ] Task management
- [ ] Milestone tracking
- [ ] Team assignments
- [ ] Timesheet integration

### Test Cases
1. **Project CRUD**
   - [ ] Create project
   - [ ] Assign team members
   - [ ] Set milestones
   - [ ] Update status
   - [ ] Close project

2. **Task Management**
   - [ ] Create task
   - [ ] Assign task
   - [ ] Update progress
   - [ ] Mark complete
   - [ ] Task dependencies

3. **Time Tracking**
   - [ ] Log time on task
   - [ ] View time entries
   - [ ] Generate timesheet
   - [ ] Project time report

---

## 🐛 Issue Tracking

### Critical Issues
1. [ ] Backend server not listening on port 5000 despite success message
2. [ ] Tenant showing as "undefined" in seeding logs

### Medium Priority Issues
- None identified yet

### Low Priority Issues
- None identified yet

---

## 📝 Notes

- Always test with a fresh database or test tenant
- Verify RBAC permissions for each module
- Test both API endpoints and UI functionality
- Check error handling and validation
- Verify audit logging for sensitive operations
- Test real-time features (WebSocket connections)
- Check mobile responsiveness for frontend

---

## 🎯 Testing Progress

**Overall Progress:** 0/10 modules tested

- [ ] Authentication & RBAC (0%)
- [ ] Employee Management (0%)
- [ ] Attendance System (0%)
- [ ] Payroll System (0%)
- [ ] Finance Management (0%)
- [ ] Asset Management (0%)
- [ ] Document Management (0%)
- [ ] Communication Module (0%)
- [ ] Sales Module (0%)
- [ ] Project Management (0%)

---

## 🚀 Next Steps

1. Fix backend server startup issue
2. Run authentication tests
3. Proceed with Employee module testing
4. Continue down the priority list

Generated: February 5, 2026
