# 🧪 Comprehensive ERP System Test Suite - User Guide

## 📋 Overview

This is a **COMPLETE** test suite that tests **EVERY SINGLE MODULE** and **EVERY USER TYPE** in the ERP system. No functionality is skipped!

## 🆕 Important: Creates NEW Tenant

⚠️ **This test creates a BRAND NEW TENANT with all fresh data!**

- ✅ **NEW tenant** is created during the first admin registration
- ✅ **All test data** is created in this new tenant
- ✅ **Completely isolated** from existing data
- ✅ **Won't affect** your production or existing test data
- ✅ **Clean slate** for every test run

**Tenant Details:**
- Tenant Name: `Test ERP Company`
- Admin Email: `admin@testerp.com`
- All 14 user types are created in this new tenant

## ✅ What This Test Covers

### 👥 All 14 User Roles Tested:
1. **ADMIN** (Administrator)
2. **HR_MANAGER** (HR Manager)
3. **HR_STAFF** (HR Staff)
4. **FINANCE_MANAGER** (Finance Manager)
5. **ACCOUNTANT** (Accountant)
6. **INVENTORY_MANAGER** (Inventory Manager)
7. **WAREHOUSE_STAFF** (Warehouse Staff)
8. **SALES_MANAGER** (Sales Manager)
9. **SALES_STAFF** (Sales Staff)
10. **PURCHASE_MANAGER** (Purchase Manager)
11. **PROJECT_MANAGER** (Project Manager)
12. **MANAGER** (Department Manager)
13. **EMPLOYEE** (Standard Employee)
14. **USER** (Basic User)

### 📦 All 30+ Modules Tested:

#### 🔐 Authentication & Security
- ✅ User Registration (all types)
- ✅ User Login (all types)
- ✅ Password Reset Flow
- ✅ RBAC System
- ✅ Roles & Permissions
- ✅ User Invites

#### 👥 Human Resources
- ✅ Employee Management (Create, Read, Update, Delete)
- ✅ Department Management
- ✅ Leave Management (Types & Requests)
- ✅ Attendance Tracking
- ✅ Payroll Management
- ✅ Payslip Generation
- ✅ Disbursement Processing
- ✅ Task Assignment
- ✅ Manager-Employee Relations
- ✅ Employee Dashboard

#### 💰 Finance & Accounting
- ✅ Finance Dashboard
- ✅ Chart of Accounts
- ✅ Journal Entries
- ✅ Trial Balance
- ✅ Balance Sheet
- ✅ Income Statement
- ✅ Expense Categories
- ✅ Expense Claims
- ✅ Accounts Payable (AP)
- ✅ AP Bills Management
- ✅ AP Payments
- ✅ Three-Way Matching
- ✅ Aging Reports
- ✅ Vendor Statements

#### 📦 Inventory & Warehouse
- ✅ Inventory Items (CRUD)
- ✅ Warehouse Management
- ✅ Stock Movements (Receipt, Issue, Transfer)
- ✅ Stock Approvals
- ✅ Stock Statistics
- ✅ Reorder Level Tracking

#### 🏗️ Asset Management
- ✅ Asset Registration
- ✅ Asset Tracking
- ✅ Asset Allocation
- ✅ Maintenance Scheduling
- ✅ Maintenance Completion
- ✅ Depreciation Calculation
- ✅ Depreciation Reports
- ✅ Asset History

#### 👔 CRM (Customer Relationship Management)
- ✅ Customer Management
- ✅ Contact Management
- ✅ Lead Management
- ✅ Lead Conversion
- ✅ Deal Pipeline
- ✅ Sales Stages
- ✅ Communication Logs
- ✅ Customer History

#### 💼 Sales Management
- ✅ Quotations
- ✅ Sales Orders
- ✅ Invoices
- ✅ Invoice Payments
- ✅ Shipment Tracking
- ✅ Quote to Order Conversion
- ✅ Order to Invoice Conversion
- ✅ Sales Analytics
- ✅ Revenue Metrics
- ✅ Payment Analytics
- ✅ Revenue Forecast

#### 🛒 Purchase Management
- ✅ Vendor Management
- ✅ Vendor Evaluation
- ✅ Purchase Requisitions
- ✅ Purchase Orders
- ✅ PO Approvals
- ✅ Goods Receipt
- ✅ Requisition to PO Conversion
- ✅ Vendor Performance

#### 📋 Project Management
- ✅ Project Creation
- ✅ Project Members
- ✅ Task Management
- ✅ Timesheet Tracking
- ✅ Timesheet Approval
- ✅ Project Progress

#### 🏭 Manufacturing
- ✅ Manufacturing Orders
- ✅ Production Planning
- ✅ Manufacturing Dashboard

#### 📄 Document Management
- ✅ Document Upload
- ✅ Document Folders
- ✅ Document Versions
- ✅ Document Sharing
- ✅ Document Templates
- ✅ Document Statistics
- ✅ Document Activities

#### 💬 Communication
- ✅ Direct Messages
- ✅ Conversations
- ✅ Announcements
- ✅ Channels
- ✅ Online Users
- ✅ Message History

#### 🔔 Notifications
- ✅ Notification List
- ✅ Unread Count
- ✅ Notification Preferences

#### 🔄 Workflows & Approvals
- ✅ Workflow Creation
- ✅ Approval Routing
- ✅ Pending Approvals
- ✅ Approval History

#### 📊 Reports & Analytics
- ✅ Employee Reports
- ✅ Leave Reports
- ✅ Attendance Reports
- ✅ Payroll Reports
- ✅ Inventory Reports
- ✅ Sales Reports
- ✅ Financial Reports
- ✅ Dashboard Metrics

#### 🏢 Company Management
- ✅ Company Information
- ✅ Branch Management
- ✅ Company Settings

#### 🔍 System Administration
- ✅ Audit Logs
- ✅ System Options
- ✅ Health Checks
- ✅ Data Export
- ✅ Data Import

## 🚀 How to Run the Tests

### Prerequisites

1. **Node.js** installed (v14 or higher)
2. **Backend server** running on `http://localhost:5000`
3. **Database** properly configured and running

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install axios form-data
```

### Running the Tests

```bash
# Run the comprehensive test suite
node COMPREHENSIVE_ERP_SYSTEM_TEST.js
```

### Configuration

You can modify these settings at the top of the test file:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';       // Change API URL
const TEST_TENANT_NAME = 'Test ERP Company';            // NEW TENANT NAME
const TEST_TENANT_EMAIL = 'admin@testerp.com';          // NEW TENANT ADMIN EMAIL
const TEST_PASSWORD = 'Test@12345';                     // Change password
```

**⚠️ IMPORTANT**: Each test run creates a **NEW TENANT** with:
- New tenant ID
- New company
- Fresh database records
- All 14 new user accounts
- Complete isolation from other tenants

## 📊 Test Output

The test suite provides detailed output including:

### Real-time Progress
- ✅ **Green checkmarks** for passed tests
- ❌ **Red X marks** for failed tests
- 📝 Test names and status codes
- ⏱️ Time taken for each test

### Final Report Includes:
- **Total tests executed**
- **Passed/Failed/Skipped counts**
- **Success rate percentage**
- **Duration of test execution**
- **Detailed failure reports** (if any)
- **Complete list of created test data**

### Sample Output:
```
═══════════════════════════════════════════════════════════════════════════
  📊 COMPREHENSIVE TEST SUITE - FINAL REPORT
═══════════════════════════════════════════════════════════════════════════

⏰ Start Time:     2026-02-13T10:00:00.000Z
⏰ End Time:       2026-02-13T10:15:30.000Z
⏱️  Duration:       930.45 seconds

📝 Total Tests:    547
✅ Passed:         542
❌ Failed:         5
⏭️  Skipped:        0
📊 Success Rate:   99.09%
```

## 📈 Test Statistics

Expected test counts:
- **Authentication Tests**: ~20 tests
- **RBAC Tests**: ~15 tests
- **HR Module Tests**: ~80 tests
- **Finance Tests**: ~50 tests
- **Inventory Tests**: ~40 tests
- **Asset Tests**: ~35 tests
- **CRM Tests**: ~45 tests
- **Sales Tests**: ~50 tests
- **Purchase Tests**: ~45 tests
- **AP Tests**: ~30 tests
- **Project Tests**: ~25 tests
- **Document Tests**: ~20 tests
- **Communication Tests**: ~15 tests
- **Reports Tests**: ~20 tests
- **System Tests**: ~15 tests
- **Additional modules**: ~42 tests

**Total: 500+ comprehensive tests**

## 🎯 What Gets Created During Tests

⚠️ **ALL DATA IS CREATED IN A NEW TENANT** - No existing data is affected!

The test suite creates complete test data in the new tenant:
- **1 NEW TENANT** (company)
- **14 different user accounts** (one for each role) in the new tenant
- **6 departments**
- **3 employees** with full profiles
- 4 leave types
- 2 leave requests
- 3 attendance records
- 1 payroll cycle with payslips
- Multiple expense categories and claims
- Complete chart of accounts
- Journal entries
- 3 inventory items
- 2 warehouses
- Stock movements
- 3 assets with allocations
- Maintenance schedules
- 3 CRM customers
- Contacts and leads
- Multiple deals
- Sales quotations and orders
- Invoices and payments
- 3 vendors
- Purchase requisitions and orders
- AP bills and payments
- 2 projects with tasks
- Timesheets
- Documents and folders
- Communication messages
- Announcements
- And much more!

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5000
   ```
   **Solution**: Make sure your backend server is running on port 5000

2. **Authentication Errors**
   ```
   Status: 401 - Unauthorized
   ```
   **Solution**: Check if user registration is working properly

3. **Database Errors**
   ```
   Prisma error: ...
   ```
   **Solution**: Ensure your database is running and migrations are up to date

4. **Timeout Errors**
   ```
   Request timeout
   ```
   **Solution**: Increase timeout or check server performance

### Debug Mode

To see more detailed output, check the test file's error handling sections.

## 📝 Test Data Cleanup

After running tests, you have test data in a new tenant:

### Option 1: Keep the Test Tenant
- The test data is in a separate tenant
- Won't interfere with other tenants
- Can be used for manual testing

### Option 2: Delete the Test Tenant
```sql
-- Delete test tenant and all related data (PostgreSQL)
-- Find the tenant ID first
SELECT id FROM "Tenant" WHERE name = 'Test ERP Company';

-- Then delete using the tenant ID
DELETE FROM "Tenant" WHERE name = 'Test ERP Company';
-- (Cascading deletes will remove all related records)
```

### Option 3: Full Database Reset (Caution!)
```bash
# ⚠️ WARNING: This deletes ALL data including ALL tenants!
npx prisma migrate reset
```

## 🎨 Customization

### Adding More Tests

You can add additional tests by:

1. Creating a new test function:
```javascript
async function testMyNewModule() {
  logHeader('🆕 MY NEW MODULE TESTS');
  
  const adminToken = testData.tokens.ADMIN;
  
  logSubHeader('Testing New Feature');
  await testAPI(
    'Test Name',
    'POST',
    '/api/endpoint',
    { data: 'value' },
    adminToken
  );
}
```

2. Adding it to the main execution:
```javascript
async function runAllTests() {
  // ... existing tests
  await testMyNewModule();
}
```

### Modifying Test Data

Edit the `testData` object to store additional IDs or information:

```javascript
const testData = {
  // ... existing data
  myNewIds: [],
  myNewData: null
};
```

## 📊 Success Criteria

The test suite is considered successful if:
- ✅ Success rate is **80% or higher**
- ✅ All critical authentication tests pass
- ✅ All CRUD operations work for main modules
- ✅ No database connection errors
- ✅ All user types can authenticate

## 🎯 Best Practices

1. **Run on a test database** - Never run on production!
2. **Check logs** - Review failed tests carefully
3. **Sequential execution** - Tests run in order, don't run in parallel
4. **Clean state** - Start with a fresh database for consistent results
5. **Monitor performance** - Note if tests are taking too long

## 🔒 Security Note

⚠️ **IMPORTANT**: This test file contains test credentials and should:
- Never be committed to public repositories
- Only be used in development/testing environments
- Never be run against production systems
- Have its credentials changed in non-local environments

## 📞 Support

If you encounter issues:
1. Check the test output for specific error messages
2. Verify all services are running
3. Check database connectivity
4. Review backend logs
5. Ensure all migrations are applied

## 🎉 Success!

A successful test run means:
- ✅ All modules are properly integrated
- ✅ All endpoints are working
- ✅ All user types can access their features
- ✅ Database operations are functioning
- ✅ Your ERP system is production-ready!

---

**Created**: February 13, 2026
**Version**: 1.0.0
**Test Coverage**: 100% of ERP modules
**Total Test Cases**: 500+
