# ATTENDANCE MODULE - FRONTEND TESTING GUIDE

## 🎯 Quick Start

**Attendance Page:** http://localhost:5173/attendance  
**Test User:** admin20260205230311@test.com  
**Password:** test123456

---

## ✅ BACKEND STATUS

**Server:** ✅ Running on port 5000  
**Frontend:** ✅ Running on port 5173  
**API Tests:** ✅ 11/13 Passed

### Test Data Available
- **2 Shifts Created:** Morning Shift 235221, Morning Shift 235242
- **1 Overtime Policy:** OT235242 (linked to Morning Shift 235242)
- **Time Tracking Records:** Clock in/out records exist
- **Employee ID:** 88d71dce-251e-4da4-8f47-1051daf2c962

---

## 🧪 FRONTEND TEST CHECKLIST

### 1. Navigation & Access
- [ ] Login with test credentials
- [ ] Navigate to Attendance module from sidebar
- [ ] Page loads without errors
- [ ] No console errors in browser dev tools

### 2. Clock In/Out Functionality
- [ ] "Clock In" button is visible
- [ ] Click "Clock In" button
- [ ] Verify clock-in time displays
- [ ] Status changes to "Clocked In"
- [ ] "Clock Out" button becomes available
- [ ] Click "Clock Out" button
- [ ] Verify clock-out time and total hours display
- [ ] Status changes to "Clocked Out"

### 3. Shift Management
- [ ] View "Shifts" tab/section
- [ ] List of shifts displays (should show 2 shifts)
- [ ] Shift details show correctly:
  - Shift name
  - Start time (09:00:00)
  - End time (17:00:00)
  - Working days
  - Break duration (60 min)
- [ ] "Create Shift" button works
- [ ] Create shift form has all required fields
- [ ] Can submit new shift successfully

### 4. Employee Shift Assignment
- [ ] View shift assignments section
- [ ] Can assign shift to employee
- [ ] Assigned shift displays in employee view
- [ ] Assignment date is correct
- [ ] Can view shift history

### 5. Overtime Tracking
- [ ] View "Overtime" tab/section
- [ ] Overtime policies list displays
- [ ] Can see policy details:
  - Policy name
  - Daily threshold (8 hours)
  - Overtime rate (1.5x)
  - Weekend rate (2.0x)
  - Holiday rate (2.5x)
- [ ] Can create new overtime policy
- [ ] Can record overtime hours manually
- [ ] Overtime calculation displays correctly

### 6. Attendance Calendar
- [ ] Calendar view displays
- [ ] Current month shown correctly (February 2026)
- [ ] Can navigate between months
- [ ] Days with attendance marked appropriately
- [ ] Clock in/out times visible on calendar
- [ ] Can click day to see details

### 7. Attendance Reports
- [ ] "Reports" tab/section available
- [ ] Can select month and year
- [ ] Can generate new report
- [ ] Report displays statistics:
  - Total days
  - Present days
  - Absent days
  - Total hours worked
  - Overtime hours
- [ ] Can download/export report
- [ ] Can view historical reports

### 8. Real-Time Features
- [ ] Clock status updates in real-time
- [ ] Notifications appear for clock events
- [ ] WebSocket connection active (check network tab)
- [ ] Updates reflect without page refresh

### 9. Leave Integration
- [ ] Leave requests affect attendance calendar
- [ ] Approved leaves mark days correctly
- [ ] Leave hours deducted from work hours
- [ ] Leave status visible in attendance view

### 10. RBAC & Permissions
- [ ] Admin can access all features
- [ ] HR role has appropriate access
- [ ] Employee role has limited access (own data only)
- [ ] Unauthorized actions show proper error messages

---

## 🐛 TESTING TIPS

### If Clock In/Out Doesn't Work:
1. Check browser console for errors
2. Verify backend is running (http://localhost:5000/api/health)
3. Check authentication token is valid
4. Ensure employee ID exists in database

### If Shifts Don't Display:
1. Verify shifts were created in backend tests
2. Check API response in Network tab
3. Run: `.\test-attendance.ps1` to create test data
4. Refresh page after creating data

### If Overtime Doesn't Calculate:
1. Ensure shift is assigned to employee
2. Verify clock in/out times span multiple hours
3. Check overtime policy is linked to correct shift
4. Review policy thresholds (8 hours daily)

### If Reports Are Empty:
1. Generate report for current month (February 2026)
2. Ensure time tracking records exist
3. Check date range in report parameters
4. Verify employee has attendance data

---

## 🔍 BROWSER DEV TOOLS CHECKS

### Console Tab
- No JavaScript errors
- No API call failures
- WebSocket connection established
- No CORS errors

### Network Tab
- API calls to http://localhost:5000/api/attendance/*
- 200 OK responses for GET requests
- 200/201 for POST requests
- JWT token in Authorization header
- WebSocket upgrade successful

### Application Tab
- localStorage has authentication token
- Session data persists
- No expired tokens

---

## 📊 EXPECTED UI ELEMENTS

### Attendance Dashboard Page
- **Header:** "Attendance & Time Tracking"
- **Tabs:** Clock In/Out, Shifts, Overtime, Reports
- **Quick Stats Cards:**
  - Today's Status
  - Hours Worked Today
  - This Week's Hours
  - This Month's Hours

### Clock In/Out Section
- Current time display
- Large "Clock In" / "Clock Out" button
- Status indicator (Clocked In / Clocked Out)
- Location tracking info (if enabled)
- Today's log:
  - Clock in time
  - Clock out time
  - Total hours
  - Break time

### Shifts Section
- **List View:**
  - Shift name
  - Time range
  - Working days
  - Actions (Edit, Delete, Assign)
- **Create Button:**  
  Opensform with fields:
  - Shift name
  - Shift code
  - Start time
  - End time
  - Break duration
  - Working days selection
  - Description

### Overtime Section
- **Policies List:**
  - Policy name
  - Daily/Weekly thresholds
  - Rate multipliers
  - Actions
- **Overtime Records:**
  - Date
  - Regular hours
  - Overtime hours
  - Approval status

### Reports Section
- **Filters:**
  - Month selector
  - Year selector
  - Employee selector (for HR/Admin)
- **Report Display:**
  - Summary statistics
  - Charts/graphs
  - Daily breakdown table
  - Export button

---

## 🚀 AUTOMATED UI TESTS (Optional)

If you have Cypress or Playwright set up:

```javascript
// Example test flow
describe('Attendance Module', () => {
  it('should clock in successfully', () => {
    cy.login('admin20260205230311@test.com', 'test123456');
    cy.visit('/attendance');
    cy.contains('Clock In').click();
    cy.contains('Clocked In').should('be.visible');
  });

  it('should display shifts', () => {
    cy.visit('/attendance/shifts');
    cy.get('.shift-card').should('have.length.at.least', 1);
  });
});
```

---

## ✅ SIGN-OFF CRITERIA

Consider the Attendance Module **PASSED** if:
- ✅ Clock in/out buttons work correctly
- ✅ Shifts display and can be created
- ✅ Overtime calculations are accurate
- ✅ Reports generate with correct data
- ✅ Calendar view shows attendance correctly
- ✅ No critical console errors
- ✅ Real-time updates work
- ✅ RBAC permissions enforced

---

## 📝 ISSUES TO REPORT

If you encounter problems, document:
1. **What you were trying to do**
2. **What happened** (screenshot if possible)
3. **Console errors** (copy from browser dev tools)
4. **Network request details** (status code, response)
5. **Steps to reproduce**

---

## 🎬 NEXT MODULE

After completing Attendance frontend testing:
- **Module 4:** Payroll System
- **Module 5:** Finance & Expense Management
- **Module 6:** Asset Management

---

**Happy Testing! 🎉**
