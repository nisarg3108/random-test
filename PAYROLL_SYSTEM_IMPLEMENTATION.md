# Payroll System Implementation

## Overview
A comprehensive payroll system has been implemented with automated salary processing, payslip generation, tax calculations, attendance integration, and salary disbursement tracking.

## Features Implemented

### 1. Database Schema (Prisma Models)

#### **Attendance Model**
- Tracks employee attendance with check-in/check-out times
- Calculates work hours and overtime automatically
- Supports multiple attendance statuses: PRESENT, ABSENT, LEAVE, HALF_DAY, WORK_FROM_HOME

#### **PayrollCycle Model**
- Manages payroll processing cycles (e.g., monthly, bi-weekly)
- Tracks cycle status: DRAFT → PROCESSING → COMPLETED → PAID
- Aggregates total gross, deductions, and net payroll amounts

#### **Payslip Model**
- Comprehensive salary breakdown with:
  - Basic salary
  - Allowances (HRA, Transport, etc.)
  - Bonuses and overtime pay
  - Tax deductions
  - Provident fund & insurance
  - Other deductions
- Attendance information (working days, present days, absences, leaves)
- Approval workflow support

#### **TaxConfiguration Model**
- Configurable tax slabs and rates
- Support for multiple tax types: INCOME_TAX, PROFESSIONAL_TAX, TDS
- Time-based tax configurations with effectiveFrom/effectiveTo dates

#### **SalaryDisbursement Model**
- Tracks salary payment transactions
- Multiple payment methods: BANK_TRANSFER, CHEQUE, CASH, UPI
- Payment status tracking: PENDING → PROCESSING → COMPLETED/FAILED

#### **SalaryComponent Model**
- Define custom salary components (allowances, deductions, bonuses)
- Support for different calculation types:
  - FIXED: Fixed amount
  - PERCENTAGE_OF_BASIC: Percentage of basic salary
  - CUSTOM: Custom formula-based calculation

### 2. Backend API Implementation

#### **Attendance Management**
- `POST /api/payroll/attendance` - Mark attendance
- `GET /api/payroll/attendance` - Get attendance records
- `GET /api/payroll/attendance/summary` - Get attendance summary

#### **Salary Components**
- `POST /api/payroll/components` - Create salary component
- `GET /api/payroll/components` - List salary components
- `PUT /api/payroll/components/:id` - Update salary component

#### **Tax Configuration**
- `POST /api/payroll/tax-config` - Create tax configuration
- `GET /api/payroll/tax-config` - List tax configurations
- `POST /api/payroll/tax-config/calculate` - Calculate tax

#### **Payroll Cycles**
- `POST /api/payroll/cycles` - Create payroll cycle
- `GET /api/payroll/cycles` - List payroll cycles
- `GET /api/payroll/cycles/:id` - Get cycle details
- `POST /api/payroll/cycles/:cycleId/generate-payslips` - Generate payslips
- `POST /api/payroll/cycles/:cycleId/disbursements` - Create disbursements

#### **Payslips**
- `GET /api/payroll/payslips` - List payslips
- `GET /api/payroll/payslips/:id` - Get payslip details
- `POST /api/payroll/payslips/:id/approve` - Approve payslip

#### **Disbursements**
- `GET /api/payroll/disbursements` - List disbursements
- `PUT /api/payroll/disbursements/:id/status` - Update disbursement status

#### **Reports**
- `GET /api/payroll/reports/summary` - Get payroll summary

### 3. Frontend Components

#### **PayrollDashboard** (`/hr/payroll`)
- Overview of payroll statistics
- Total payroll, average salary, pending approvals, completed disbursements
- Recent payroll cycles and payslips
- Quick actions for common tasks

#### **PayrollCyclesList** (`/hr/payroll/cycles`)
- List all payroll cycles
- Filter by status (DRAFT, PROCESSING, COMPLETED, PAID)
- Create new payroll cycles
- View cycle details and statistics

#### **PayrollCycleDetails** (`/hr/payroll/cycles/:id`)
- Detailed view of a specific payroll cycle
- Summary cards showing gross salary, deductions, net payroll, and employee count
- Generate payslips for all employees in the cycle
- Create disbursements for approved payslips
- View all payslips and disbursements in the cycle

#### **PayslipDetails** (`/hr/payroll/payslips/:id`)
- Professional payslip view with:
  - Employee details
  - Payment information
  - Earnings breakdown (basic salary, allowances, bonuses, overtime)
  - Deductions breakdown (taxes, PF, insurance, other)
  - Net salary calculation
- Print and download PDF functionality
- Approve payslip

### 4. Key Business Logic

#### **Automated Salary Calculation**
```javascript
// Based on attendance
const dailyBasic = basicSalary / 30;
const calculatedBasic = dailyBasic * presentDays;

// Add allowances
const allowancesTotal = Object.values(allowances).reduce((sum, val) => sum + val, 0);

// Calculate overtime
const overtimeRate = (basicSalary / 30 / 8) * 2; // Double rate
const overtimePay = overtimeHours * overtimeRate;

// Gross salary
const grossSalary = calculatedBasic + allowancesTotal + overtimePay;
```

#### **Tax Calculation**
```javascript
// Slab-based tax calculation
for (const slab of taxSlabs) {
  if (annualIncome > slab.min) {
    const taxableAmount = Math.min(annualIncome, slab.max || annualIncome) - slab.min;
    const slabTax = (taxableAmount * slab.rate) / 100;
    totalTax += slabTax;
  }
}
```

#### **Attendance Integration**
- Automatic calculation of work hours from check-in/check-out times
- Overtime calculation (hours beyond standard 8-hour workday)
- Attendance summary for salary computation

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma (Updated with payroll models)
├── src/
│   └── modules/
│       └── hr/
│           ├── payroll.service.js (Business logic)
│           ├── payroll.controller.js (Request handlers)
│           └── payroll.routes.js (API routes)
└── src/app.js (Updated with payroll routes)

frontend/
├── src/
│   ├── api/
│   │   └── payrollAPI.js (API client)
│   └── pages/
│       └── hr/
│           └── payroll/
│               ├── PayrollDashboard.jsx
│               ├── PayrollCyclesList.jsx
│               ├── PayrollCycleDetails.jsx
│               ├── PayslipDetails.jsx
│               └── index.js
└── src/App.jsx (Updated with payroll routes)
```

## Usage Guide

### Creating a Payroll Cycle

1. Navigate to `/hr/payroll/cycles`
2. Click "New Cycle"
3. Enter cycle details:
   - Name (e.g., "January 2026 Payroll")
   - Start Date
   - End Date
   - Payment Date
4. Click "Create Cycle"

### Generating Payslips

1. Open a payroll cycle in DRAFT status
2. Click "Generate Payslips"
3. System will:
   - Fetch all active employees
   - Calculate attendance summary for the cycle period
   - Compute salary based on attendance
   - Apply allowances and deductions
   - Calculate taxes
   - Generate payslips

### Approving Payslips

1. View a payslip by clicking on it
2. Review all details
3. Click "Approve Payslip"
4. Status changes to APPROVED

### Creating Disbursements

1. Open a payroll cycle with approved payslips
2. Click "Create Disbursements"
3. System creates disbursement records for all approved payslips
4. Update disbursement status as payments are processed

### Managing Attendance

1. Use the attendance API to mark daily attendance
2. System automatically calculates work hours and overtime
3. Attendance data is used for salary calculation

## Tax Configuration Example

```javascript
{
  "name": "Income Tax 2026",
  "taxType": "INCOME_TAX",
  "slabs": [
    { "min": 0, "max": 250000, "rate": 0 },
    { "min": 250001, "max": 500000, "rate": 5 },
    { "min": 500001, "max": 750000, "rate": 10 },
    { "min": 750001, "max": 1000000, "rate": 15 },
    { "min": 1000001, "max": 1250000, "rate": 20 },
    { "min": 1250001, "max": 1500000, "rate": 25 },
    { "min": 1500001, "max": null, "rate": 30 }
  ]
}
```

## Database Migration

The database schema has been updated with a migration:
```bash
npx prisma migrate dev --name add_payroll_models
```

Migration file: `20260201165441_add_payroll_models`

## Next Steps / Future Enhancements

1. **Attendance Management UI**
   - Create a dedicated attendance tracking page
   - Bulk attendance marking
   - Attendance reports and analytics

2. **Salary Components Configuration UI**
   - Create/Edit custom salary components
   - Component templates for different employee categories

3. **Tax Configuration UI**
   - Configure tax slabs
   - Multiple tax regime support
   - Automatic tax updates based on financial year

4. **Reports & Analytics**
   - Payroll expense trends
   - Department-wise salary breakdown
   - Tax liability reports
   - Attendance analytics

5. **Integration Features**
   - Bank file generation for salary transfer
   - Email payslips to employees
   - SMS notifications for salary credit
   - Export to accounting software

6. **Employee Self-Service**
   - Employees can view their payslips
   - Download payslip PDFs
   - View salary history
   - Tax computation statements

7. **Compliance**
   - Statutory reports (PF, ESI, PT)
   - Form 16 generation
   - Annual tax statements

## API Testing

You can test the payroll APIs using tools like Postman or cURL:

```bash
# Create a payroll cycle
curl -X POST http://localhost:5000/api/payroll/cycles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "February 2026 Payroll",
    "startDate": "2026-02-01",
    "endDate": "2026-02-28",
    "paymentDate": "2026-03-05"
  }'

# Generate payslips
curl -X POST http://localhost:5000/api/payroll/cycles/CYCLE_ID/generate-payslips \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get payslips
curl -X GET http://localhost:5000/api/payroll/payslips \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

- All monetary values are stored in the database as Float (you may want to consider using Decimal for precision)
- Payslip numbers are auto-generated using format: `PAY-{CycleName}-{EmployeeCode}`
- The system calculates tax on an annual basis and divides by 12 for monthly deduction
- Overtime is calculated at 2x the hourly rate
- The system assumes a 30-day month for salary calculations

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

---

**Implementation Date:** February 1, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete
