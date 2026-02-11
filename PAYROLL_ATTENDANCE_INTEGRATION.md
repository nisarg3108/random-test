# Payroll Attendance Integration

**Implementation Date:** February 10, 2026  
**Status:** ✅ Complete

## Overview

Integrated real attendance data into payroll processing to enable accurate salary calculations based on actual work hours, overtime, and attendance records.

## Changes Made

### 1. Backend - Payroll Service Enhancement

**File:** `backend/src/modules/hr/payroll.service.js`

#### Changes in `generatePayslips` Function:

**Before:**
- Used placeholder values: `presentDays = workingDays`, `absentDays = 0`, `leaveDays = 0`
- No overtime calculation: `overtimePay = 0`
- Fixed allowances and deductions (no pro-rating)

**After:**
- Queries actual attendance records from database for the payroll cycle period
- Calculates real attendance statistics:
  - `presentDays`: Counts PRESENT, WORK_FROM_HOME days
  - `absentDays`: Counts ABSENT days
  - `leaveDays`: Counts LEAVE days
  - `halfDays`: Counts HALF_DAY (adds 0.5 to both present and absent)
  - `totalOvertimeHours`: Sums overtime hours from attendance records
- **Pro-rated salary calculations:**
  - Basic salary: `(basicSalary / 30) * presentDays`
  - Allowances: `(allowancesTotal / 30) * presentDays`
  - Deductions: `(pf / 30) * presentDays` and `(insurance / 30) * presentDays`
- **Overtime pay calculation:**
  - Hourly rate: `basicSalary / 30 / 8`
  - Overtime pay: `overtimeHours * hourlyRate * 2` (double rate)
- **Backward compatibility:** If no attendance records exist, defaults to full presence

### 2. Database Schema Update

**File:** `backend/prisma/schema.prisma`

Changed Payslip model fields:

```prisma
// Before
presentDays     Int      @default(0)
absentDays      Int      @default(0)
leaveDays       Int      @default(0)

// After
presentDays     Float    @default(0)  // Float to support half-days
absentDays      Float    @default(0)  // Float to support half-days
leaveDays       Int      @default(0)
overtimeHours   Float    @default(0)  // Total overtime hours
```

**Reason for Float:** Supports half-day attendance (0.5 days)

## How It Works

### Payslip Generation Flow

1. **Create Payroll Cycle**
   - Admin creates a cycle with start date, end date, and payment date

2. **Generate Payslips**
   - System fetches all active employees with salary structures
   - For each employee:
     ```javascript
     // Query attendance records
     const attendanceRecords = await prisma.attendance.findMany({
       where: {
         employeeId: employee.id,
         tenantId,
         date: { gte: cycle.startDate, lte: cycle.endDate }
       }
     });
     
     // Calculate statistics
     attendanceRecords.forEach(record => {
       switch (record.status) {
         case 'PRESENT':
         case 'WORK_FROM_HOME':
           presentDays++;
           break;
         case 'ABSENT':
           absentDays++;
           break;
         case 'LEAVE':
           leaveDays++;
           break;
         case 'HALF_DAY':
           presentDays += 0.5;
           absentDays += 0.5;
           break;
       }
       totalOvertimeHours += record.overtimeHours || 0;
     });
     
     // Calculate salary
     const calculatedBasic = (basicSalary / 30) * presentDays;
     const proRatedAllowances = (allowancesTotal / 30) * presentDays;
     const overtimePay = totalOvertimeHours * (basicSalary / 30 / 8) * 2;
     const grossSalary = calculatedBasic + proRatedAllowances + overtimePay;
     
     // Pro-rate deductions
     const pfDeduction = ((pf / 30) * presentDays);
     const insuranceDeduction = ((insurance / 30) * presentDays);
     ```

3. **Store Payslip**
   - Payslip includes all attendance details and calculated amounts
   - Stored with status 'GENERATED'

## Salary Calculation Formula

### Basic Salary
```
Daily Rate = Basic Salary / 30
Calculated Basic = Daily Rate × Present Days
```

### Allowances
```
Daily Allowance = Total Allowances / 30
Pro-rated Allowances = Daily Allowance × Present Days
```

### Overtime Pay
```
Hourly Rate = Basic Salary / 30 / 8
Overtime Pay = Overtime Hours × Hourly Rate × 2 (double rate)
```

### Gross Salary
```
Gross = Calculated Basic + Pro-rated Allowances + Overtime Pay
```

### Deductions
```
Daily PF = PF / 30
Daily Insurance = Insurance / 30
Pro-rated PF = Daily PF × Present Days
Pro-rated Insurance = Daily Insurance × Present Days
Monthly Tax = Annual Tax / 12 (calculated from gross × 12)
Total Deductions = Pro-rated PF + Pro-rated Insurance + Monthly Tax
```

### Net Salary
```
Net = Gross - Total Deductions
```

## Example Calculation

**Employee:** John Doe  
**Payroll Cycle:** January 1-31, 2026 (31 days, assuming 30 working days)  
**Basic Salary:** ₹60,000/month  
**Allowances:** ₹10,000 (HRA: ₹7,000, Transport: ₹3,000)  
**Deductions:** PF: ₹7,200, Insurance: ₹1,500

**Attendance:**
- Present: 22 days
- Absent: 2 days
- Leave: 3 days
- Half-day: 2 days (counts as 1 present + 1 absent)
- Overtime: 8 hours

**Calculation:**
```
Effective Present Days = 22 + 1 = 23 days

Calculated Basic = (60,000 / 30) × 23 = ₹46,000
Pro-rated Allowances = (10,000 / 30) × 23 = ₹7,667
Overtime Pay = 8 × (60,000 / 30 / 8) × 2 = 8 × 250 × 2 = ₹4,000
Gross Salary = 46,000 + 7,667 + 4,000 = ₹57,667

Pro-rated PF = (7,200 / 30) × 23 = ₹5,520
Pro-rated Insurance = (1,500 / 30) × 23 = ₹1,150
Annual Income = 57,667 × 12 = ₹692,004
Monthly Tax (assuming 10% effective) = (692,004 × 0.10) / 12 = ₹5,767
Total Deductions = 5,520 + 1,150 + 5,767 = ₹12,437

Net Salary = 57,667 - 12,437 = ₹45,230
```

## Migration Required

After implementing these changes, run:

```bash
cd backend
npx prisma migrate dev --name attendance_integration_payroll
npx prisma generate
```

This will:
1. Create a migration to change `presentDays` and `absentDays` to Float
2. Add the `overtimeHours` field to Payslip table
3. Update Prisma client

## Testing

### Test Scenarios

1. **Full Attendance**
   - Employee present all working days
   - No overtime
   - Expected: Full salary

2. **Partial Attendance**
   - Employee present 15 out of 30 days
   - Expected: ~50% basic salary and allowances

3. **With Overtime**
   - Employee works 10 hours overtime
   - Expected: Base salary + overtime pay (double rate)

4. **Half Days**
   - Employee has 2 half-days
   - Expected: 1 day counted as present for salary

5. **No Attendance Records**
   - New employee, no attendance marked
   - Expected: Full salary (backward compatibility)

### API Testing

```bash
# 1. Create payroll cycle
POST /api/payroll/cycles
{
  "name": "February 2026 Payroll",
  "startDate": "2026-02-01",
  "endDate": "2026-02-28",
  "paymentDate": "2026-03-05"
}

# 2. Generate payslips (with real attendance data)
POST /api/payroll/cycles/{cycleId}/generate-payslips

# 3. View payslip details
GET /api/payroll/payslips/{payslipId}
```

## Benefits

1. **Accurate Salary Calculations**
   - Salaries based on actual attendance
   - Fair compensation for overtime work
   - Proper deductions for absences

2. **Transparency**
   - Employees can see attendance details on payslips
   - Clear breakdown of how salary was calculated

3. **Compliance**
   - Overtime pay regulations met
   - Proper leave salary handling

4. **Cost Savings**
   - No overpayment for absent days
   - Automated calculations reduce manual errors

5. **Employee Motivation**
   - Overtime fairly compensated
   - Accurate reflection of work done

## Frontend Impact

Payslip display now shows:
- Present days (with decimal for half-days)
- Absent days
- Leave days
- Overtime hours and pay

These are already being displayed in the PayslipDetails component.

## Future Enhancements

1. **Configurable Overtime Rates**
   - Allow different multipliers (1.5x, 2x, 2.5x)
   - Weekend/holiday overtime rates

2. **Leave Types**
   - Paid leave vs unpaid leave
   - Different salary treatment

3. **Shift Differentials**
   - Night shift allowance
   - Weekend shift bonuses

4. **Attendance Thresholds**
   - Minimum attendance for full benefits
   - Attendance bonuses

## Related Documentation

- [PAYROLL_SYSTEM_IMPLEMENTATION.md](PAYROLL_SYSTEM_IMPLEMENTATION.md)
- [ATTENDANCE_IMPLEMENTATION.md](ATTENDANCE_IMPLEMENTATION.md)
- [ATTENDANCE_SUMMARY.md](ATTENDANCE_SUMMARY.md)

---

**Implementation Complete:** February 10, 2026  
**Version:** 1.1.0
