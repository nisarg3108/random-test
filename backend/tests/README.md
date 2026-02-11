# ERP System - Comprehensive Test Suite

## 📋 Overview

This test suite provides comprehensive testing for all modules in the ERP system, following the example pattern from `test-payroll-attendance.js`.

## 🚀 Quick Start

### Prerequisites
- Backend server running on `http://localhost:5000`
- Valid user credentials (admin account recommended)
- Node.js installed

### Run All Tests
```bash
cd backend
node tests/test-runner.js all admin@company.com password
```

### Run Specific Module
```bash
node tests/test-runner.js payroll admin@company.com password
node tests/test-runner.js hr admin@company.com password
node tests/test-runner.js finance admin@company.com password
```

### Using Environment Variables
```bash
TEST_EMAIL=admin@company.com TEST_PASSWORD=password node tests/test-runner.js all
```

## 📦 Test Modules

### 1. **Payroll Module** (`payroll.test.js`)
Tests payroll cycles, payslips, disbursements, and attendance integration.

**Key Tests:**
- ✅ Get Salary Components
- ✅ Create Payroll Cycle
- ✅ Generate Payslips with Attendance Integration
- ✅ Quick Stats Cards (Gross, Deductions, Net, Attendance Days)
- ✅ Earnings Breakdown Visualization
- ✅ Deductions Breakdown Visualization
- ✅ Attendance Integration (Present/Absent/Leave Days)
- ✅ Create & Manage Disbursements
- ✅ Export Payslip PDF
- ✅ Responsive Design Check

**Example:**
```bash
node tests/test-runner.js payroll admin@company.com password
```

### 2. **HR Module** (`hr.test.js`)
Tests employee management, leave requests, tasks, and HR dashboard.

**Key Tests:**
- ✅ Employee CRUD Operations
- ✅ Leave Type Management
- ✅ Leave Request Creation & Approval
- ✅ Task Management
- ✅ Employee Dashboard
- ✅ HR Dashboard Stats
- ✅ Export Employee Data

### 3. **Attendance Module** (`attendance.test.js`)
Tests check-in/out, time tracking, overtime, and attendance reports.

**Key Tests:**
- ✅ Check-in/Check-out
- ✅ Monthly Attendance Reports
- ✅ Time Tracking Entries
- ✅ Overtime Calculation
- ✅ Late Arrivals Tracking
- ✅ Attendance Dashboard
- ✅ Export Attendance Reports

### 4. **Finance Module** (`finance.test.js`)
Tests expense claims, accounting, journal entries, and financial reports.

**Key Tests:**
- ✅ Expense Category Management
- ✅ Expense Claim Creation & Approval
- ✅ Chart of Accounts
- ✅ Journal Entries
- ✅ Balance Sheet
- ✅ Profit & Loss Statement
- ✅ Finance Dashboard

### 5. **Inventory Module** (`inventory.test.js`)
Tests items, stock movements, warehouses, and stock valuation.

**Key Tests:**
- ✅ Item Management
- ✅ Warehouse Management
- ✅ Stock Movements (IN/OUT)
- ✅ Low Stock Alerts
- ✅ Stock Valuation
- ✅ Export Inventory Reports

### 6. **CRM Module** (`crm.test.js`)
Tests leads, customers, contacts, deals, activities, and pipelines.

**Key Tests:**
- ✅ Lead Management
- ✅ Lead to Customer Conversion
- ✅ Contact Management
- ✅ Pipeline Management
- ✅ Deal Creation & Stage Updates
- ✅ Activity Tracking
- ✅ CRM Dashboard
- ✅ Sales Funnel Analytics

### 7. **Sales Module** (`sales.test.js`)
Tests quotations, orders, invoices, payments, and sales analytics.

**Key Tests:**
- ✅ Quotation Creation
- ✅ Quotation to Order Conversion
- ✅ Invoice Generation
- ✅ Payment Recording
- ✅ Sales Analytics
- ✅ Conversion Metrics
- ✅ Export Sales Reports

### 8. **Purchase Module** (`purchase.test.js`)
Tests vendors, purchase orders, goods receipts, and purchase analytics.

**Key Tests:**
- ✅ Vendor Management
- ✅ Purchase Order Creation
- ✅ Goods Receipt Recording
- ✅ Purchase Analytics

### 9. **Projects Module** (`projects.test.js`)
Tests project management, tasks, timesheets, and project analytics.

**Key Tests:**
- ✅ Project Creation & Management
- ✅ Project Member Management
- ✅ Task Management
- ✅ Timesheet Entries
- ✅ Project Dashboard
- ✅ Project Analytics

### 10. **Assets Module** (`assets.test.js`)
Tests asset management, allocations, maintenance, and depreciation.

**Key Tests:**
- ✅ Asset Creation & Management
- ✅ Asset Allocation & Return
- ✅ Maintenance Records
- ✅ Depreciation Calculation
- ✅ Asset Dashboard

### 11. **Accounts Payable Module** (`ap.test.js`)
Tests bills, payments, aging reports, and AP dashboard.

**Key Tests:**
- ✅ Bill Creation & Management
- ✅ Payment Recording
- ✅ Overdue Bills Tracking
- ✅ Aging Report
- ✅ AP Dashboard
- ✅ Export AP Reports

### 12. **Communication Module** (`communication.test.js`)
Tests announcements, messages, and notifications.

**Key Tests:**
- ✅ Announcement Creation
- ✅ Message Sending
- ✅ Inbox Management
- ✅ Unread Count Tracking

### 13. **Documents Module** (`documents.test.js`)
Tests document management, folders, sharing, and storage.

**Key Tests:**
- ✅ Folder Management
- ✅ Document Upload
- ✅ Document Search
- ✅ Version Control
- ✅ Document Sharing
- ✅ Storage Stats

### 14. **Reports Module** (`reports.test.js`)
Tests report generation, scheduling, and analytics.

**Key Tests:**
- ✅ Available Reports
- ✅ Sales/HR/Finance Report Generation
- ✅ Report History
- ✅ Report Download
- ✅ Report Scheduling
- ✅ Dashboard Analytics
- ✅ Custom Report Export

## 📊 Test Results

After running tests, you'll see:
```
📊 Test Summary
═══════════════════════════════════════
✅ Passed: 150
❌ Failed: 5
⏭️  Skipped: 10
📝 Total: 165

🎯 Success Rate: 90.91%
```

## 🎯 Test Coverage

Each module test includes:
1. **CRUD Operations** - Create, Read, Update, Delete
2. **Business Logic** - Workflows, calculations, validations
3. **Integration** - Cross-module functionality
4. **Dashboard & Analytics** - Stats and metrics
5. **Export Functionality** - PDF, CSV, Excel exports
6. **Responsive Design** - UI/UX verification (manual)

## 🔧 Configuration

### API Base URL
Default: `http://localhost:5000/api`

Change via environment variable:
```bash
API_URL=http://your-api-url.com/api node tests/test-runner.js all
```

### Test Credentials
```bash
TEST_EMAIL=your-email@company.com
TEST_PASSWORD=your-password
```

## 📝 Test Pattern

Each test follows this structure:
```javascript
module.exports = {
  async run(apiCall, logTest) {
    // Test 1: Description
    try {
      const response = await apiCall('GET', '/endpoint');
      logTest('Test Name', 'pass', '- Details');
    } catch (error) {
      logTest('Test Name', 'fail', `- ${error.message}`);
    }
  }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify credentials are correct
   - Check user has appropriate permissions
   - Ensure backend is running

2. **Connection Refused**
   - Verify backend is running on correct port
   - Check API_URL environment variable
   - Ensure no firewall blocking

3. **Tests Skipped**
   - Some tests depend on previous test data
   - Run full module test to create dependencies
   - Check database has required seed data

4. **Permission Denied**
   - Use admin account for full test coverage
   - Check RBAC permissions are configured
   - Run `setup-rbac.bat` if needed

## 📈 Best Practices

1. **Run tests in order**: Some tests create data for subsequent tests
2. **Use test environment**: Don't run on production data
3. **Review failures**: Check error messages for root cause
4. **Clean test data**: Periodically clean up test records
5. **Update tests**: Keep tests in sync with API changes

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: |
          cd backend
          npm install
          node tests/test-runner.js all
        env:
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

## 📞 Support

For issues or questions:
1. Check test output for specific error messages
2. Review module-specific test file
3. Verify API endpoint is working via Postman
4. Check backend logs for detailed errors

## 🎉 Success Criteria

A successful test run should have:
- ✅ 90%+ pass rate
- ✅ All critical paths tested
- ✅ No authentication errors
- ✅ All CRUD operations working
- ✅ Dashboard stats loading correctly

## 📚 Additional Resources

- [API Documentation](../API_DOCS.md)
- [Module Testing Guide](../MODULE_TESTING_GUIDE.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [RBAC Setup](../RBAC_IMPLEMENTATION_GUIDE.md)
