# Reports & Analytics - Comprehensive Implementation Guide

## 📋 Overview

The ERP system features a powerful, multi-layered reporting and analytics engine that provides:
- **Pre-built Financial Reports** (P&L, Balance Sheet)
- **HR Analytics** (attendance, payroll, leave tracking)
- **Inventory Reports** (stock levels, movements, valuations)
- **Custom Report Builder** (user-defined queries with filters & aggregations)
- **Export Capabilities** (PDF & Excel formats)
- **Report Templates & Scheduling** (save and reuse report configurations)

---

## 🏗️ Architecture Overview

### Two Reporting Stacks

The system maintains two reporting implementations for backward compatibility and feature richness:

#### 1. **Main Reports Module** (`/api/reports`)
- **Location**: `backend/src/modules/reports/report.*`
- **Features**: Advanced custom builder, templates, saved reports
- **Frontend**: Full UI with visualizations

#### 2. **Legacy Reporting Module** (`/api/reporting`)
- **Location**: `backend/src/modules/reports/reporting.*`
- **Features**: Scheduled reports, dashboard summaries
- **Use Case**: Background jobs and system integrations

---

## 📂 File Structure

```
backend/src/modules/reports/
├── report.service.js          # Main reporting logic
├── report.controller.js       # HTTP handlers
├── report.routes.js           # API endpoints
├── reporting.service.js       # Legacy reporting
├── reporting.controller.js    # Legacy controllers
├── reporting.routes.js        # Legacy routes
├── export.pdf.js              # PDF generation (pdfkit)
└── export.excel.js            # Excel generation (exceljs)

frontend/src/pages/reports/
├── ReportsDashboard.jsx       # Main landing page
├── ProfitLossReport.jsx       # P&L statement
├── BalanceSheetReport.jsx     # Balance sheet
├── HRAnalyticsReport.jsx      # HR metrics
├── InventoryReport.jsx        # Stock reports
├── CustomReportBuilder.jsx    # Query builder
├── SavedReportDetails.jsx     # View saved reports
└── index.js                   # Route exports

frontend/src/api/
└── reports.api.js             # API client

frontend/src/store/
└── reports.store.js           # State management (Zustand)

backend/prisma/schema.prisma
├── ReportTemplate             # User-defined templates
├── Report                     # Saved report results
└── ReportSchedule             # Scheduled jobs
```

---

## 🔧 Backend Implementation

### 1. Financial Reports

#### Profit & Loss Statement
```javascript
// API: GET /api/reports/financial/profit-loss
// Query params: startDate, endDate, compareWithPreviousPeriod

generateProfitLossReport(tenantId, startDate, endDate, options)
```

**Features:**
- Revenue calculation from sales
- COGS from inventory/manufacturing
- Operating expenses aggregation
- Net profit/loss calculation
- Period comparison (optional)

**Data Sources:**
- `JournalEntry` (transactions)
- `LedgerEntry` (account balances)
- `ChartOfAccounts` (account hierarchy)

#### Balance Sheet
```javascript
// API: GET /api/reports/financial/balance-sheet
// Query params: asOfDate

generateBalanceSheetReport(tenantId, asOfDate)
```

**Features:**
- Assets (current + fixed)
- Liabilities (current + long-term)
- Equity calculation
- Balance verification (Assets = Liabilities + Equity)

**Data Sources:**
- `LedgerEntry` (balances)
- `ChartOfAccounts` (categorization)

---

### 2. HR Analytics

```javascript
// API: GET /api/reports/hr/analytics
// Query params: startDate, endDate, departmentId, employeeId

generateHRAnalyticsReport(tenantId, startDate, endDate, filters)
```

**Metrics Included:**
- **Attendance**: Present/absent days, attendance rate
- **Leave**: Leave taken by type, balance
- **Payroll**: Salary expenses, average salary, cost per employee
- **Headcount**: Total employees, by department, by status
- **Turnover**: Hiring rate, attrition rate

**Data Sources:**
- `Employee` (headcount)
- `Attendance` (daily records)
- `Leave` (leave records)
- `Payslip` (salary data)

---

### 3. Inventory Reports

```javascript
// API: GET /api/reports/inventory
// Query params: warehouseId, categoryId, lowStockOnly

generateInventoryReport(tenantId, filters)
```

**Report Types:**
- **Stock Levels**: Current quantities by item
- **Valuation**: Total inventory value (FIFO/WAC)
- **Low Stock Alerts**: Items below reorder level
- **Movement Summary**: In/out transactions
- **Aging Analysis**: Slow-moving stock identification

**Data Sources:**
- `InventoryItem` (items)
- `WarehouseStock` (quantities)
- `StockMovement` (transactions)
- `ItemCategory` (grouping)

---

### 4. Custom Report Builder

```javascript
// API: POST /api/reports/custom/execute
// Body: { dataSource, filters, columns, aggregations, groupBy, orderBy }

executeCustomReport(tenantId, reportConfig)
```

**Supported Data Sources:**
- `employees` - Employee records
- `inventory` - Inventory items & stock
- `expenses` - Expense records
- `leaves` - Leave applications
- `attendance` - Attendance records
- `sales` - Sales orders
- `purchases` - Purchase orders

**Filter Operations:**
- `equals`, `notEquals`
- `greaterThan`, `lessThan`
- `contains` (string search)
- `between` (date/number ranges)
- `in` (array membership)

**Aggregations:**
- `sum`, `avg`, `min`, `max`
- `count`, `countDistinct`

**Example Request:**
```json
{
  "dataSource": "employees",
  "filters": [
    { "field": "status", "operator": "equals", "value": "ACTIVE" },
    { "field": "department", "operator": "equals", "value": "Engineering" }
  ],
  "columns": ["name", "email", "position", "salary"],
  "aggregations": [
    { "field": "salary", "operation": "avg", "alias": "avgSalary" }
  ],
  "groupBy": ["department"],
  "orderBy": [{ "field": "salary", "direction": "DESC" }]
}
```

---

### 5. Report Templates

Save frequently-used report configurations for reuse.

```javascript
// Create Template
POST /api/reports/templates
{
  "name": "Monthly Sales Report",
  "description": "Sales performance by region",
  "reportType": "CUSTOM",
  "config": { /* report configuration */ }
}

// List Templates
GET /api/reports/templates

// Execute Template
POST /api/reports/templates/:id/execute
```

**Database Model:**
```prisma
model ReportTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  reportType  String   // FINANCIAL, HR, INVENTORY, CUSTOM
  config      Json     // Report configuration
  createdBy   String
  createdAt   DateTime @default(now())
}
```

---

### 6. Saved Reports

Store generated report results for historical reference.

```javascript
// Save Report
POST /api/reports/save
{
  "name": "Q1 2026 P&L",
  "reportType": "PROFIT_LOSS",
  "data": { /* report results */ }
}

// List Saved Reports
GET /api/reports/saved

// View Report
GET /api/reports/:id
```

---

### 7. Export Functionality

#### PDF Export
```javascript
// API: GET /api/reports/export?reportId=xxx&format=pdf
// Or: POST /api/reports/export with data payload

exportToPDF(reportType, reportData, options)
```

**Features** (`export.pdf.js`):
- Professional header with company logo
- Auto-pagination
- Table formatting with borders
- Color-coded sections
- Footer with page numbers and timestamp
- Supports: FINANCIAL, HR, INVENTORY, CUSTOM reports

**Library**: `pdfkit`

#### Excel Export
```javascript
// API: GET /api/reports/export?reportId=xxx&format=excel
// Or: POST /api/reports/export with data payload

exportToExcel(reportType, reportData, options)
```

**Features** (`export.excel.js`):
- Multiple worksheets
- Cell formatting (bold headers, number formats)
- Auto-column width
- Formulas for totals
- Conditional formatting
- Data validation

**Library**: `exceljs`

**Export Types:**
- `FINANCIAL`: P&L and Balance Sheet tabs
- `HR`: Employee summary, department breakdown
- `INVENTORY`: Stock levels, movements
- `CUSTOM`: Dynamic columns based on report config

---

### 8. Report Scheduling (Legacy Module)

```javascript
// API: POST /api/reporting/schedule
{
  "reportType": "BALANCE_SHEET",
  "frequency": "MONTHLY",
  "recipients": ["cfo@company.com"],
  "dayOfMonth": 1,
  "time": "08:00"
}
```

**Frequencies:**
- `DAILY` - Every day at specified time
- `WEEKLY` - Specific day of week
- `MONTHLY` - Specific day of month

**Backend Job:**
- Uses `node-cron` for scheduling
- Generates report automatically
- Emails to recipients (future: notification system)

---

## 🎨 Frontend Implementation

### 1. Reports Dashboard

**File**: `frontend/src/pages/reports/ReportsDashboard.jsx`

**Features:**
- Quick access cards for each report type
- Recent reports list
- Saved templates
- Statistics overview (total reports, recent activity)

**Route**: `/reports`

---

### 2. Financial Reports UI

#### Profit & Loss Report

**File**: `ProfitLossReport.jsx`

**Features:**
- Date range picker
- Period comparison toggle
- Revenue breakdown (product/service categories)
- Expense categorization (operating, admin, marketing)
- Net profit visualization
- Export buttons (PDF/Excel)
- Chart visualizations (revenue trends, expense pie chart)

**API Integration:**
```javascript
import { generateProfitLoss, exportReport } from '@/api/reports.api';

const data = await generateProfitLoss({ startDate, endDate });
```

#### Balance Sheet Report

**File**: `BalanceSheetReport.jsx`

**Features:**
- Date selector (as of date)
- Assets section (current + fixed)
- Liabilities section (current + long-term)
- Equity calculation
- Balance verification indicator
- Drill-down to account details
- Export options

---

### 3. HR Analytics Report

**File**: `HRAnalyticsReport.jsx`

**Features:**
- Date range selection
- Department filter
- Employee filter
- Metric cards:
  - Total employees
  - Average attendance rate
  - Total leave days
  - Payroll expenses
- Charts:
  - Attendance trend (line chart)
  - Leave distribution (bar chart)
  - Department headcount (pie chart)
  - Salary distribution (histogram)
- Data table with employee-level details
- Export to Excel for detailed analysis

**Data Fetching:**
```javascript
const analytics = await reportsStore.fetchHRAnalytics({
  startDate,
  endDate,
  departmentId,
  employeeId
});
```

---

### 4. Inventory Report

**File**: `InventoryReport.jsx`

**Features:**
- Warehouse selector
- Category filter
- Low stock toggle
- Report types:
  - Stock levels
  - Valuation summary
  - Stock movement
- Table with:
  - Item name & code
  - Category
  - Warehouse
  - Quantity
  - Unit price
  - Total value
  - Status indicators (low stock, overstock)
- Summary cards (total items, total value, low stock count)
- Export functionality

---

### 5. Custom Report Builder

**File**: `CustomReportBuilder.jsx`

**Features:**
- **Step 1**: Select data source (dropdown)
- **Step 2**: Add filters
  - Field selector
  - Operator selector (equals, contains, between, etc.)
  - Value input
  - Add/remove filter buttons
- **Step 3**: Select columns (multi-select checkbox)
- **Step 4**: Configure aggregations
  - Function (sum, avg, count)
  - Field selector
  - Alias input
- **Step 5**: Group by & Sort
- **Preview** button (shows sample data)
- **Execute** button (runs full report)
- **Save as Template** button
- **Export** button

**State Management:**
```javascript
const [config, setConfig] = useState({
  dataSource: '',
  filters: [],
  columns: [],
  aggregations: [],
  groupBy: [],
  orderBy: []
});
```

**Execution:**
```javascript
const result = await customReportStore.executeReport(config);
```

---

### 6. Saved Report Details

**File**: `SavedReportDetails.jsx`

**Features:**
- Report metadata (name, type, date created)
- Report data display (table format)
- Re-run report button (with updated date range)
- Export to PDF/Excel
- Delete report button
- Share button (future: send via email)

---

### 7. Export Modal Component

**Shared Component**: `ExportReportModal.jsx` (to be created)

**Features:**
- Format selector (PDF/Excel)
- Include charts toggle (PDF only)
- Filename input
- Export button with loading state

---

## 🔗 Integration Points

### 1. Navigation Integration

Add reports link to main navigation:

```javascript
// frontend/src/components/layout/Sidebar.jsx
{
  name: 'Reports',
  icon: ChartBarIcon,
  path: '/reports',
  children: [
    { name: 'Dashboard', path: '/reports' },
    { name: 'Financial', path: '/reports/financial' },
    { name: 'HR Analytics', path: '/reports/hr' },
    { name: 'Inventory', path: '/reports/inventory' },
    { name: 'Custom Builder', path: '/reports/custom' }
  ]
}
```

### 2. Module-Specific Report Links

#### From Accounting Module
```javascript
// Button in ChartOfAccounts.jsx
<button onClick={() => navigate('/reports/financial')}>
  View Financial Reports
</button>
```

#### From HR Module
```javascript
// Button in EmployeeList.jsx or Payroll Dashboard
<button onClick={() => navigate('/reports/hr')}>
  View HR Analytics
</button>
```

#### From Inventory Module
```javascript
// Button in InventoryList.jsx
<button onClick={() => navigate('/reports/inventory')}>
  View Inventory Reports
</button>
```

### 3. Dashboard Widgets

Quick report widgets for main dashboard:

```javascript
// frontend/src/pages/Dashboard.jsx
<ReportWidget
  title="Monthly Revenue"
  value="₹2,45,000"
  change="+12%"
  linkTo="/reports/financial/profit-loss"
/>
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   User UI   │ (Reports Dashboard / Specific Report Pages)
└──────┬──────┘
       │
       │ API Request (Zustand store → reports.api.js)
       ▼
┌─────────────────┐
│  Report Routes  │ (/api/reports/*)
└──────┬──────────┘
       │
       │ Validate & Route
       ▼
┌─────────────────┐
│Report Controller│ (report.controller.js)
└──────┬──────────┘
       │
       │ Process Request
       ▼
┌─────────────────┐
│ Report Service  │ (report.service.js)
└──────┬──────────┘
       │
       ├─────► Query Database (Prisma)
       │       ├── Employees, Attendance, Leave, Payslips (HR)
       │       ├── Inventory, StockMovement (Inventory)
       │       ├── JournalEntry, LedgerEntry (Financial)
       │       └── Custom queries based on dataSource
       │
       ├─────► Aggregate & Calculate
       │       ├── Sum, Average, Count
       │       ├── Group By dimensions
       │       └── Apply filters
       │
       ├─────► Format Response
       │       └── Structure data for frontend
       │
       └─────► Export (if requested)
               ├── PDF (export.pdf.js + pdfkit)
               └── Excel (export.excel.js + exceljs)
```

---

## 🛠️ Setup & Configuration

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install pdfkit exceljs
```

#### Environment Variables
```env
# .env
REPORT_EXPORT_PATH=./exports
MAX_EXPORT_SIZE=10MB
REPORT_CACHE_TTL=300
```

#### Register Routes
```javascript
// backend/src/app.js
import reportRoutes from './modules/reports/report.routes.js';
import reportingRoutes from './modules/reports/reporting.routes.js';

app.use('/api/reports', reportRoutes);
app.use('/api/reporting', reportingRoutes);
```

### 2. Database Migration

```bash
npx prisma migrate dev --name add_reporting_models
```

**Models to verify:**
- `ReportTemplate`
- `Report`
- `ReportSchedule`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install recharts date-fns
```

#### Configure Routes
```javascript
// frontend/src/App.jsx
import ReportRoutes from './pages/reports';

<Route path="/reports/*" element={<ReportRoutes />} />
```

---

## 🧪 Testing

### Backend API Tests

```bash
# Test P&L report
curl http://localhost:5000/api/reports/financial/profit-loss?startDate=2026-01-01&endDate=2026-01-31 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test custom report
curl -X POST http://localhost:5000/api/reports/custom/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSource": "employees",
    "filters": [{"field": "status", "operator": "equals", "value": "ACTIVE"}],
    "columns": ["name", "email", "position"]
  }'

# Test export
curl http://localhost:5000/api/reports/export?reportId=xxx&format=pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.pdf
```

### Frontend Testing

1. Navigate to `/reports`
2. Click on "Financial Reports" → P&L
3. Select date range and generate
4. Verify data display
5. Click "Export to PDF" and verify download
6. Test other report types similarly

### Integration Testing

Test report links from other modules:
- Accounting → Financial Reports
- HR → HR Analytics
- Inventory → Inventory Reports

---

## 🚀 What's Already Implemented

✅ **Backend:**
- All report service methods
- Financial report generation (P&L, Balance Sheet)
- HR analytics aggregation
- Inventory reporting
- Custom report builder with filters & aggregations
- Report template CRUD
- Saved report functionality
- PDF export (pdfkit)
- Excel export (exceljs)
- API routes and controllers

✅ **Frontend:**
- Reports dashboard page
- P&L report page
- Balance sheet page
- HR analytics page
- Inventory report page
- Custom report builder page
- Saved report details page
- API client methods
- Zustand store setup

✅ **Database:**
- `ReportTemplate` model
- `Report` model
- `ReportSchedule` model

---

## 📝 What Needs to Be Added

### High Priority

1. **Enhanced Visualizations**
   - Add `recharts` library for better charts
   - Implement trend analysis (line/area charts)
   - Add drill-down capabilities (click to view details)

2. **Export Enhancements**
   - Add chart inclusion in PDF exports
   - Implement batch export (multiple reports at once)
   - Add email delivery for exports

3. **Report Scheduling UI**
   - Frontend page for managing scheduled reports
   - Cron expression builder
   - Email recipient management

4. **Real-time Updates**
   - WebSocket integration for live report updates
   - Auto-refresh for dashboard widgets

### Medium Priority

5. **Report Sharing**
   - Generate shareable links (with expiry)
   - Role-based access control for reports
   - Collaborative features (comments, annotations)

6. **Advanced Filters**
   - Saved filter presets
   - Complex filter builder (AND/OR logic)
   - Date range presets (Last 7 days, MTD, QTD, YTD)

7. **Report Versioning**
   - Track changes to report templates
   - Compare report results across periods
   - Audit trail for report access

8. **Performance Optimization**
   - Implement report caching
   - Add pagination for large datasets
   - Background job for heavy reports

### Low Priority

9. **Additional Report Types**
   - Customer/Vendor reports
   - Tax reports (GST, TDS)
   - Asset depreciation reports
   - Project profitability reports

10. **Mobile App Support**
    - Mobile-optimized report views
    - Push notifications for scheduled reports
    - Offline report viewing

11. **AI/ML Features**
    - Predictive analytics (forecast revenue, expenses)
    - Anomaly detection (unusual patterns)
    - Automated insights and recommendations

---

## 📚 API Reference

### Financial Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/financial/profit-loss` | GET | Generate P&L statement |
| `/api/reports/financial/balance-sheet` | GET | Generate balance sheet |

**Query Parameters:**
- `startDate` (ISO date)
- `endDate` (ISO date)
- `asOfDate` (for balance sheet)
- `compareWithPreviousPeriod` (boolean)

### HR Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/hr/analytics` | GET | Generate HR analytics report |

**Query Parameters:**
- `startDate`
- `endDate`
- `departmentId` (optional)
- `employeeId` (optional)

### Inventory Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/inventory` | GET | Generate inventory report |

**Query Parameters:**
- `warehouseId` (optional)
- `categoryId` (optional)
- `lowStockOnly` (boolean)

### Custom Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/custom/execute` | POST | Execute custom report |

**Request Body:**
```json
{
  "dataSource": "string",
  "filters": [{ "field": "string", "operator": "string", "value": "any" }],
  "columns": ["string"],
  "aggregations": [{ "field": "string", "operation": "string", "alias": "string" }],
  "groupBy": ["string"],
  "orderBy": [{ "field": "string", "direction": "ASC|DESC" }]
}
```

### Report Templates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/templates` | GET | List all templates |
| `/api/reports/templates` | POST | Create template |
| `/api/reports/templates/:id` | GET | Get template details |
| `/api/reports/templates/:id` | PUT | Update template |
| `/api/reports/templates/:id` | DELETE | Delete template |
| `/api/reports/templates/:id/execute` | POST | Execute template |

### Saved Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/saved` | GET | List saved reports |
| `/api/reports/:id` | GET | Get report details |
| `/api/reports/save` | POST | Save report result |
| `/api/reports/:id` | DELETE | Delete saved report |

### Export

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/export` | GET/POST | Export report (PDF/Excel) |

**Query Parameters (GET):**
- `reportId`
- `format` (pdf or excel)

**Request Body (POST):**
```json
{
  "reportType": "FINANCIAL|HR|INVENTORY|CUSTOM",
  "data": { /* report data */ },
  "format": "pdf|excel",
  "options": { /* format-specific options */ }
}
```

---

## 🎯 Best Practices

### Performance
- Use database indexes on frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed reports
- Use background jobs for heavy reports

### Security
- Validate all user inputs
- Enforce tenant isolation in queries
- Implement role-based access control
- Audit report access (who viewed what, when)

### User Experience
- Show loading states during report generation
- Provide progress indicators for long-running reports
- Display helpful error messages
- Save user preferences (filters, columns)

### Code Quality
- Keep service methods focused and testable
- Use TypeScript for better type safety
- Write unit tests for calculations
- Document complex business logic

---

## 🔍 Troubleshooting

### Report Generation Issues

**Problem**: Report returns empty data
- **Check**: Date range validity
- **Check**: Permissions/tenant ID
- **Check**: Data availability in source tables

**Problem**: Export fails
- **Check**: Disk space for file generation
- **Check**: PDF/Excel library installation
- **Check**: File write permissions

### Performance Issues

**Problem**: Report takes too long to generate
- **Solution**: Add database indexes
- **Solution**: Optimize queries (use aggregations)
- **Solution**: Implement caching
- **Solution**: Move to background job

---

## 📖 Summary

The Reports & Analytics module is a **fully functional, production-ready** system with:

✅ **4 Pre-built Report Types** (Financial, HR, Inventory, Custom)  
✅ **Export to PDF & Excel**  
✅ **Report Templates** (save and reuse configurations)  
✅ **Saved Reports** (historical reference)  
✅ **Custom Report Builder** (user-defined queries)  
✅ **Frontend UI** (complete pages with visualizations)  
✅ **API Integration** (RESTful endpoints)  
✅ **Database Models** (Prisma schema)

**Next Steps:**
1. Review the implementation files listed in this guide
2. Test each report type using the API reference
3. Enhance visualizations with charts (recharts)
4. Implement report scheduling UI
5. Add email delivery for exports

**For Questions or Issues:**
- Check the troubleshooting section
- Review API documentation
- Inspect browser console for frontend errors
- Check backend logs for service errors

---

**Document Version:** 1.0  
**Last Updated:** February 11, 2026  
**Status:** ✅ Complete Implementation with Enhancement Roadmap
