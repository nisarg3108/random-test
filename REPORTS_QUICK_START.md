# Reports & Analytics - Quick Start Guide

## ✅ What's Already Implemented

The Reports & Analytics module is **fully implemented** with:

### Backend (Complete ✓)
- ✅ Financial reports service (P&L, Balance Sheet)
- ✅ HR analytics service
- ✅ Inventory reporting service
- ✅ Custom report builder with filters & aggregations
- ✅ Report templates (CRUD operations)
- ✅ Saved reports functionality
- ✅ PDF export (`export.pdf.js` using pdfkit)
- ✅ Excel export (`export.excel.js` using exceljs)
- ✅ API routes registered in `app.js`

### Frontend (Complete ✓)
- ✅ Reports Dashboard (`ReportsDashboard.jsx`)
- ✅ Profit & Loss Report (`financial/ProfitLossReport.jsx`)
- ✅ Balance Sheet Report (`financial/BalanceSheetReport.jsx`)
- ✅ HR Analytics Report (`hr/HRAnalyticsReport.jsx`)
- ✅ Inventory Report (`inventory/InventoryReport.jsx`)
- ✅ Custom Report Builder (`custom/CustomReportBuilder.jsx`)
- ✅ Saved Report Details (`SavedReportDetails.jsx`)
- ✅ API client (`api/reports.api.js`)
- ✅ Zustand store (`store/reports.store.js`)
- ✅ Routes configured in `App.jsx`

---

## 🚀 Quick Test Guide

### 1. Start the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Navigate to Reports

1. Open browser: `http://localhost:5173`
2. Login with your credentials
3. Navigate to: **Reports** (in sidebar)

### 3. Test Each Report Type

#### A. Profit & Loss Report
- **URL**: `/reports/financial/profit-loss`
- **Test Steps**:
  1. Select date range (start & end date)
  2. Check "Compare with previous period" (optional)
  3. Click "Generate Report"
  4. Verify revenue, expenses, and net profit display
  5. Click "Export PDF" → verify download
  6. Click "Export Excel" → verify download

#### B. Balance Sheet Report
- **URL**: `/reports/financial/balance-sheet`
- **Test Steps**:
  1. Select "As of Date"
  2. Click "Generate Report"
  3. Verify Assets, Liabilities, and Equity sections
  4. Verify balance equation (Assets = Liabilities + Equity)
  5. Test export functionality

#### C. HR Analytics Report
- **URL**: `/reports/hr/analytics`
- **Test Steps**:
  1. Select date range
  2. Filter by department (optional)
  3. Filter by employee (optional)
  4. Click "Generate Report"
  5. Verify attendance, leave, payroll metrics
  6. Check charts (if implemented)
  7. Export to Excel

#### D. Inventory Report
- **URL**: `/reports/inventory`
- **Test Steps**:
  1. Select warehouse (optional)
  2. Select category (optional)
  3. Toggle "Low stock only"
  4. Click "Generate Report"
  5. Verify stock levels, valuations
  6. Export functionality

#### E. Custom Report Builder
- **URL**: `/reports/custom`
- **Test Steps**:
  1. Select data source (employees, inventory, expenses, etc.)
  2. Add filters:
     - Field: "status"
     - Operator: "equals"
     - Value: "ACTIVE"
  3. Select columns (name, email, position)
  4. Add aggregation (optional):
     - Function: "count"
     - Field: "id"
  5. Click "Execute"
  6. Verify custom report displays
  7. Click "Save as Template"
  8. Export results

---

## 📡 API Testing (Backend Only)

Test backend endpoints directly:

### 1. Get Authentication Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Save the `token` from response.

### 2. Test Financial Reports

```bash
# Profit & Loss
curl -G http://localhost:5000/api/reports/financial/profit-loss \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31"

# Balance Sheet
curl -G http://localhost:5000/api/reports/financial/balance-sheet \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-urlencode "asOfDate=2026-01-31"
```

### 3. Test HR Analytics

```bash
curl -G http://localhost:5000/api/reports/hr/analytics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31"
```

### 4. Test Inventory Report

```bash
curl -G http://localhost:5000/api/reports/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-urlencode "lowStockOnly=false"
```

### 5. Test Custom Report Builder

```bash
curl -X POST http://localhost:5000/api/reports/custom/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSource": "employees",
    "filters": [
      {"field": "status", "operator": "equals", "value": "ACTIVE"}
    ],
    "columns": ["name", "email", "position"],
    "aggregations": [
      {"field": "id", "operation": "count", "alias": "totalCount"}
    ]
  }'
```

### 6. Test Report Templates

```bash
# Create template
curl -X POST http://localhost:5000/api/reports/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Active Employees Report",
    "description": "List of all active employees",
    "reportType": "CUSTOM",
    "config": {
      "dataSource": "employees",
      "filters": [{"field": "status", "operator": "equals", "value": "ACTIVE"}],
      "columns": ["name", "email", "department"]
    }
  }'

# List templates
curl http://localhost:5000/api/reports/templates \
  -H "Authorization: Bearer YOUR_TOKEN"

# Execute template
curl -X POST http://localhost:5000/api/reports/templates/{TEMPLATE_ID}/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Test Export Functionality

```bash
# Export to PDF
curl -X POST http://localhost:5000/api/reports/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "FINANCIAL",
    "format": "pdf",
    "data": {
      "totalRevenue": 500000,
      "totalExpenses": 300000,
      "netProfit": 200000
    }
  }' \
  --output report.pdf

# Export to Excel
curl -X POST http://localhost:5000/api/reports/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "HR",
    "format": "excel",
    "data": {
      "employees": [
        {"name": "John Doe", "department": "Engineering", "salary": 50000}
      ]
    }
  }' \
  --output report.xlsx
```

---

## 🔍 Verification Checklist

### Backend Verification
- [ ] All report service files exist in `backend/src/modules/reports/`
- [ ] Routes registered in `backend/src/app.js`:
  - `app.use('/api/reports', reportRoutes)`
  - `app.use('/api/reporting', reportingRoutes)`
- [ ] Export libraries installed:
  - `pdfkit`
  - `exceljs`
- [ ] Database models exist:
  - `ReportTemplate`
  - `Report`
  - `ReportSchedule`

### Frontend Verification
- [ ] All report pages exist in proper folders:
  - `pages/reports/financial/ProfitLossReport.jsx`
  - `pages/reports/financial/BalanceSheetReport.jsx`
  - `pages/reports/hr/HRAnalyticsReport.jsx`
  - `pages/reports/inventory/InventoryReport.jsx`
  - `pages/reports/custom/CustomReportBuilder.jsx`
- [ ] Routes configured in `App.jsx`:
  - `/reports`
  - `/reports/financial/profit-loss`
  - `/reports/financial/balance-sheet`
  - `/reports/hr/analytics`
  - `/reports/inventory`
  - `/reports/custom`
  - `/reports/saved/:id`
- [ ] API client exists: `api/reports.api.js`
- [ ] Store exists: `store/reports.store.js`

---

## 🐛 Troubleshooting

### Issue: Reports page not loading

**Solution:**
1. Check browser console for errors
2. Verify routes in `App.jsx`
3. Ensure all components are properly exported in `pages/reports/index.js`

### Issue: API returns 404

**Solution:**
1. Verify backend is running on port 5000
2. Check routes are registered in `backend/src/app.js`
3. Verify authentication token is valid

### Issue: Export fails

**Solution:**
1. Check if `pdfkit` and `exceljs` are installed:
   ```bash
   cd backend
   npm list pdfkit exceljs
   ```
2. Install if missing:
   ```bash
   npm install pdfkit exceljs
   ```

### Issue: No data in reports

**Solution:**
1. Ensure sample data exists in database
2. Check date range filters
3. Verify tenant ID matches logged-in user
4. Check database tables have records:
   - Financial: `JournalEntry`, `LedgerEntry`
   - HR: `Employee`, `Attendance`, `Leave`, `Payslip`
   - Inventory: `InventoryItem`, `WarehouseStock`

---

## 📝 Next Steps (Optional Enhancements)

While the module is fully functional, consider these enhancements:

### 1. Enhanced Visualizations
```bash
cd frontend
npm install recharts
```
Then add charts to report pages using recharts library.

### 2. Report Scheduling UI
Create a frontend page for managing scheduled reports:
- Configure frequency (daily, weekly, monthly)
- Set email recipients
- Enable/disable schedules

### 3. Report Caching
Implement caching for frequently accessed reports:
```javascript
// backend/src/modules/reports/report.service.js
import NodeCache from 'node-cache';
const reportCache = new NodeCache({ stdTTL: 300 }); // 5 min cache
```

### 4. Real-time Updates
Add WebSocket integration for live report updates:
```javascript
// Use existing Socket.IO setup
io.emit('report:updated', { reportId, data });
```

---

## ✅ Summary

**Status**: ✅ **FULLY IMPLEMENTED AND READY TO USE**

**What Works:**
- ✅ All 4 report types (Financial, HR, Inventory, Custom)
- ✅ Export to PDF and Excel
- ✅ Report templates (save & reuse)
- ✅ Saved reports (historical reference)
- ✅ Custom query builder with filters & aggregations
- ✅ Complete frontend UI with all pages
- ✅ Full backend API with proper routes

**Test It Now:**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to: `http://localhost:5173/reports`
4. Generate your first report!

---

**Document Version:** 1.0  
**Last Updated:** February 11, 2026  
**Status:** ✅ Ready for Production Use
