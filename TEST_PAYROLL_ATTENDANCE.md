# Payroll Attendance Integration - Manual Testing Guide

## Prerequisites
✅ Backend running on http://localhost:5000
✅ At least one employee with salary structure
✅ Some attendance records (optional - will default to full attendance)

## Testing Steps

### Step 1: Login and Get Token

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

**Save the token** for subsequent requests.

---

### Step 2: Check Existing Employees

**Request:**
```bash
GET http://localhost:5000/api/employees
Authorization: Bearer YOUR_TOKEN
```

**What to check:**
- At least one ACTIVE employee
- Employee has salary structure
- Note an employee ID for later

---

### Step 3: (Optional) Check Attendance Records

**Request:**
```bash
GET http://localhost:5000/api/attendance/reports/{employeeId}?month=2&year=2026
Authorization: Bearer YOUR_TOKEN
```

**What to check:**
- Present days, absent days, leave days
- Overtime hours
- If no data, system will default to full attendance (backward compatible)

---

### Step 4: Create Payroll Cycle

**Request:**
```bash
POST http://localhost:5000/api/payroll/cycles
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "February 2026 Test",
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-28T23:59:59.999Z",
  "paymentDate": "2026-03-05T00:00:00.000Z",
  "notes": "Testing attendance integration"
}
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "February 2026 Test",
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-28T23:59:59.999Z",
  "status": "DRAFT",
  ...
}
```

**Save the cycle ID** for the next step.

---

### Step 5: Generate Payslips (The Key Test!)

**Request:**
```bash
POST http://localhost:5000/api/payroll/cycles/{cycleId}/generate-payslips
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "cycle": {...},
  "payslips": [...],
  "summary": {
    "totalEmployees": 5,
    "totalGross": 500000,
    "totalDeductions": 75000,
    "totalNet": 425000
  }
}
```

**What happens internally:**
1. ✅ System queries attendance records for the cycle period
2. ✅ Calculates real present/absent/leave days
3. ✅ Sums overtime hours
4. ✅ Pro-rates salary based on attendance
5. ✅ Calculates overtime pay at 2x rate
6. ✅ Pro-rates deductions

---

### Step 6: View Payslip Details

**Request:**
```bash
GET http://localhost:5000/api/payroll/cycles/{cycleId}
Authorization: Bearer YOUR_TOKEN
```

**Check the payslip data:**
```json
{
  "payslips": [
    {
      "id": "...",
      "payslipNumber": "PAY-...",
      "employee": {
        "name": "John Doe",
        "employeeCode": "EMP001"
      },
      "workingDays": 28,
      "presentDays": 23.5,    // ← Real attendance data (Float supports half-days)
      "absentDays": 2.5,      // ← Real attendance data
      "leaveDays": 2,         // ← Real leave data
      "overtimeHours": 8,     // ← Real overtime data
      "basicSalary": 47000,   // ← Pro-rated: (60000/30) × 23.5
      "allowances": {...},    // ← Pro-rated allowances
      "overtime": 4000,       // ← Calculated: 8 × (60000/30/8) × 2
      "grossSalary": 58667,
      "providentFund": 5640,  // ← Pro-rated: (7200/30) × 23.5
      "insurance": 1175,      // ← Pro-rated
      "taxDeductions": 5867,
      "totalDeductions": 12682,
      "netSalary": 45985,
      "status": "GENERATED"
    }
  ]
}
```

---

### Step 7: View Individual Payslip

**Request:**
```bash
GET http://localhost:5000/api/payroll/payslips/{payslipId}
Authorization: Bearer YOUR_TOKEN
```

**Verify:**
- ✅ Attendance fields show real data (not placeholders)
- ✅ Present days can be decimal (e.g., 23.5 for half-days)
- ✅ Overtime hours and pay are included
- ✅ Basic salary is pro-rated correctly
- ✅ Allowances are pro-rated
- ✅ Deductions are pro-rated

---

## Test Scenarios

### Scenario 1: Full Attendance
**Setup:**
- Employee present all 28 working days
- No overtime

**Expected:**
- presentDays: 28
- absentDays: 0
- Basic salary: Full amount
- Net salary: Full amount minus standard deductions

---

### Scenario 2: Partial Attendance
**Setup:**
- Employee present 15 days, absent 5 days, leave 8 days
- No overtime

**Expected:**
- presentDays: 15
- absentDays: 5
- leaveDays: 8
- Basic salary: ~50% of monthly (15/30)
- Allowances: ~50% of monthly
- Deductions: ~50% of monthly (PF, insurance)

---

### Scenario 3: With Overtime
**Setup:**
- Employee present 25 days
- 10 hours overtime

**Expected:**
- presentDays: 25
- overtimeHours: 10
- Overtime pay = 10 × (basicSalary/30/8) × 2
- Example: 10 × (60000/30/8) × 2 = 10 × 250 × 2 = ₹5,000

---

### Scenario 4: Half Days
**Setup:**
- Employee has 2 half-days during the cycle

**Expected:**
- Half-days counted as 0.5 present + 0.5 absent each
- presentDays: whole + 0.5 + 0.5 = whole + 1
- absentDays: 0.5 + 0.5 = 1

---

### Scenario 5: No Attendance Records (Backward Compatibility)
**Setup:**
- New employee with no attendance marked

**Expected:**
- presentDays: workingDays (full month)
- absentDays: 0
- Full salary paid (system defaults to full attendance)

---

## Calculation Formulas

### Present Days Calculation
```
presentDays = count(PRESENT) + count(WORK_FROM_HOME) + (count(HALF_DAY) × 0.5)
```

### Absent Days Calculation
```
absentDays = count(ABSENT) + (count(HALF_DAY) × 0.5)
```

### Basic Salary Pro-rating
```
dailyRate = basicSalary / 30
calculatedBasic = dailyRate × presentDays
```

### Allowances Pro-rating
```
dailyAllowances = totalAllowances / 30
proRatedAllowances = dailyAllowances × presentDays
```

### Overtime Pay
```
hourlyRate = basicSalary / 30 / 8
overtimePay = overtimeHours × hourlyRate × 2  // Double rate
```

### Gross Salary
```
grossSalary = calculatedBasic + proRatedAllowances + overtimePay
```

### Deductions Pro-rating
```
dailyPF = monthlyPF / 30
proRatedPF = dailyPF × presentDays

dailyInsurance = monthlyInsurance / 30
proRatedInsurance = dailyInsurance × presentDays
```

### Tax Calculation
```
annualIncome = grossSalary × 12
tax = calculateFromSlabs(annualIncome)
monthlyTax = tax / 12
```

### Net Salary
```
netSalary = grossSalary - (proRatedPF + proRatedInsurance + monthlyTax)
```

---

## Using Postman/Thunder Client

Import this collection or test manually:

1. **Set Variables:**
   - baseUrl: `http://localhost:5000/api`
   - token: `(your auth token)`

2. **Test All Endpoints** in sequence

3. **Monitor Console** for backend logs showing attendance queries

---

## What to Verify

✅ **Attendance Integration:**
- [ ] Payslip shows real present/absent days from attendance
- [ ] Half-days are properly counted as decimals
- [ ] Leave days are tracked

✅ **Overtime Calculation:**
- [ ] Overtime hours are summed from attendance
- [ ] Overtime pay = hours × (basicSalary/30/8) × 2
- [ ] Overtime is added to gross salary

✅ **Pro-rating:**
- [ ] Basic salary = (basicSalary/30) × presentDays
- [ ] Allowances are pro-rated by attendance
- [ ] PF and insurance are pro-rated by attendance

✅ **Backward Compatibility:**
- [ ] Employees with no attendance default to full pay
- [ ] No errors when attendance data missing

✅ **Database:**
- [ ] presentDays and absentDays stored as Float
- [ ] overtimeHours stored in payslip
- [ ] All values calculated correctly

---

## Troubleshooting

**Issue:** Login fails
- **Solution:** Check credentials, ensure user exists

**Issue:** No employees found
- **Solution:** Create employees through HR module first

**Issue:** Payslip shows 0 days
- **Solution:** Check attendance records exist for the date range

**Issue:** Overtime not calculated
- **Solution:** Ensure attendance records have overtimeHours field populated

**Issue:** Wrong calculations
- **Solution:** Check attendance records match expected values
- **Solution:** Verify salary structure exists for employee

---

## Success Criteria

✅ Payslips generated without errors
✅ Attendance data appears in payslips (not zeros/placeholders)
✅ Present days can be decimals (supports half-days)
✅ Overtime hours and pay are calculated
✅ Salary is pro-rated correctly by attendance
✅ Deductions are pro-rated correctly
✅ System works even when no attendance records exist

---

**Test Status:** Ready to test!
**Date:** February 10, 2026
