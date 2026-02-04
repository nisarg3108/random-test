# Attendance & Time Tracking Module

## Overview

A comprehensive Attendance & Time Tracking system integrated into the ERP platform that provides:

1. **Clock In/Out System** - Digital time tracking with location logging
2. **Shift Management** - Define, assign, and manage employee shifts
3. **Overtime Tracking** - Track and approve overtime with configurable policies
4. **Attendance Reports** - Generate detailed individual and team attendance reports
5. **Leave Integration** - Seamless integration with leave management system

---

## Features Implemented

### 1. Clock In/Out System

**Backend Endpoints:**
- `POST /api/attendance/clock-in` - Employee clocks in
- `POST /api/attendance/clock-out` - Employee clocks out
- `GET /api/attendance/clock-status/:employeeId` - Get current clock status

**Functionality:**
- Real-time clock in/out with timestamp recording
- Automatic calculation of work hours
- Location tracking (GPS coordinates or IP address)
- Prevents duplicate clock-ins on the same day
- Automatic attendance status updates based on work hours

**Database Tables:**
- `TimeTracking` - Records all clock in/out events
- `Attendance` - Daily attendance status (PRESENT/ABSENT/LEAVE/HALF_DAY/WORK_FROM_HOME)

**Frontend Component:**
- `ClockInOut.jsx` - Interactive clock in/out interface with:
  - Real-time elapsed time display
  - Location-based tracking
  - Status indicators
  - Success/error notifications

---

### 2. Shift Management

**Backend Endpoints:**
- `POST /api/attendance/shifts` - Create new shift
- `GET /api/attendance/shifts` - Get all shifts
- `POST /api/attendance/shifts/assign` - Assign shift to employee
- `GET /api/attendance/shifts/employee/:employeeId` - Get employee's current shift
- `GET /shifts/employee/:employeeId?limit=10` - Get shift history

**Functionality:**
- Define shifts with:
  - Shift name and code
  - Start and end times
  - Break duration
  - Working days
- Assign multiple shifts to employees with effective dates
- Track shift history with status (ACTIVE/INACTIVE/ENDED)
- Support for shift changes and rotations

**Database Tables:**
- `Shift` - Shift definitions
- `ShiftAssignment` - Employee shift assignments with dates

**Frontend Component:**
- `ShiftManagement.jsx` - Shift management interface with:
  - View current shift details
  - Request shift changes
  - View shift history
  - Shift assignments table

---

### 3. Overtime Tracking

**Backend Endpoints:**
- `POST /api/attendance/overtime-policies` - Create overtime policy
- `GET /api/attendance/overtime-hours/:employeeId?date=YYYY-MM-DD` - Calculate overtime
- `POST /api/attendance/overtime-records/:employeeId` - Record overtime manually
- `PUT /api/attendance/overtime-records/:overtimeRecordId/approve` - Approve overtime

**Functionality:**
- Define multiple overtime policies with:
  - Daily/weekly/monthly thresholds
  - Different rates (standard 1.5x, weekend 2x, holiday 2.5x)
- Automatic overtime calculation based on:
  - Hours worked vs. shift duration
  - Day of week (weekends)
  - Holiday dates
- Overtime request workflow with approval tracking
- Automatic rate multipliers application

**Database Tables:**
- `OvertimePolicy` - Policy definitions
- `OvertimeRecord` - Overtime requests and approvals

**Frontend Component:**
- `OvertimeTracking.jsx` - Overtime tracking interface with:
  - Daily overtime summary
  - Overtime policy display
  - Manual overtime recording
  - Approval status tracking

---

### 4. Attendance Reports

**Backend Endpoints:**
- `POST /api/attendance/reports/:employeeId/generate?month=M&year=Y` - Generate report
- `GET /api/attendance/reports/:employeeId?month=M&year=Y` - Get report
- `GET /api/attendance/reports/department/:departmentId?month=M&year=Y` - Team report

**Report Metrics:**
- Total working days
- Present days
- Absent days
- Leave days
- Half-days
- Work-from-home days
- Total work hours
- Total overtime hours
- Attendance percentage

**Database Tables:**
- `AttendanceReport` - Generated monthly reports with aggregated statistics

**Frontend Component:**
- `AttendanceReports.jsx` - Comprehensive reporting with:
  - Individual and team reports
  - Chart visualizations (Pie, Bar charts)
  - Month/year filtering
  - PDF export functionality
  - Attendance percentage indicators

---

### 5. Leave Integration

**Integration Points:**
- When leave is approved, automatic attendance record creation
- Leave status linked to `LeaveIntegration` table
- Prevents clock-in conflicts on leave days
- Automatic attendance status update to "ON_LEAVE"

**Backend Updates:**
- Modified `leaveRequest.service.js` to call `integrateLeaveWithAttendance()` when leave is approved
- `LeaveIntegration` model links leave requests to attendance records

**Features:**
- Seamless leave-to-attendance synchronization
- Prevents leave and attendance conflicts
- Automatic half-day support for partial leaves

---

## Database Schema

### New Models Created:

```prisma
model Shift
- id (UUID)
- tenantId
- name, code
- startTime, endTime (HH:MM format)
- breakDuration (minutes)
- workingDays (string)
- isActive
- Relationships: shiftAssignments[], overtimePolicies[]

model ShiftAssignment
- id (UUID)
- employeeId, shiftId, tenantId
- assignedFrom, assignedTo (DateTime)
- status (ACTIVE/INACTIVE/ENDED)
- Relationships: employee, shift

model TimeTracking
- id (UUID)
- employeeId, tenantId
- date, checkInTime, checkOutTime
- checkInLocation, checkOutLocation
- workHours, breakHours
- status (CHECKED_IN/CHECKED_OUT/INCOMPLETE)
- Relationships: employee

model OvertimePolicy
- id (UUID)
- tenantId, shiftId
- name, code
- dailyThreshold, weeklyThreshold, monthlyThreshold
- overtimeRate, weekendRate, holidayRate
- isActive
- Relationships: shift, overtimeRecords[]

model OvertimeRecord
- id (UUID)
- employeeId, overtimePolicyId, tenantId
- date, overtimeHours, overtimeRate, overtimeAmount
- reason, approvalStatus, approvedBy, approvedAt
- Relationships: employee, overtimePolicy

model AttendanceReport
- id (UUID)
- employeeId, tenantId
- month, year
- totalWorkingDays, presentDays, absentDays, leaveDays, halfDays, workFromHomeDays
- totalWorkHours, totalOvertimeHours
- attendancePercentage
- Relationships: employee

model LeaveIntegration
- id (UUID)
- leaveRequestId, employeeId, tenantId
- leaveDate, status, attendanceStatus
- Relationships: employee
```

---

## API Routes

### Clock In/Out Routes
```
POST   /api/attendance/clock-in          - Clock in
POST   /api/attendance/clock-out         - Clock out
GET    /api/attendance/clock-status/:id  - Get status
```

### Shift Routes
```
POST   /api/attendance/shifts            - Create shift
GET    /api/attendance/shifts            - Get all shifts
POST   /api/attendance/shifts/assign     - Assign shift
GET    /api/attendance/shifts/employee/:id - Get employee shift
GET    /shifts/employee/:id              - Get shift history
```

### Overtime Routes
```
POST   /api/attendance/overtime-policies       - Create policy
GET    /api/attendance/overtime-hours/:id      - Calculate OT
POST   /api/attendance/overtime-records/:id    - Record OT
PUT    /api/attendance/overtime-records/:id/approve - Approve OT
```

### Report Routes
```
POST   /api/attendance/reports/:id/generate    - Generate report
GET    /api/attendance/reports/:id             - Get report
GET    /api/attendance/reports/department/:id  - Get team report
```

### Leave Integration Routes
```
POST   /api/attendance/leave-integration - Integrate leave
```

---

## Frontend Components

### File Structure
```
frontend/src/pages/hr/
├── AttendanceDashboard.jsx      - Main attendance dashboard
├── ClockInOut.jsx               - Clock in/out interface
├── ShiftManagement.jsx          - Shift management
├── OvertimeTracking.jsx         - Overtime tracking
├── AttendanceReports.jsx        - Attendance reporting
└── index.js                     - Component exports
```

### Key Features:
- **Real-time clock tracking** with elapsed time display
- **Interactive charts** (Pie, Bar) for attendance visualization
- **Month/year filtering** for reports
- **PDF export** capability for reports
- **Responsive design** for mobile and desktop
- **Status indicators** (Present, Absent, Leave, etc.)
- **Notification system** for clock in/out events

---

## Backend Services

### attendance.service.js
Comprehensive service with methods for:
- Clock in/out operations
- Shift management and assignments
- Overtime calculation and recording
- Attendance report generation
- Leave integration

### shift.service.js
Shift-specific operations:
- CRUD operations for shifts
- Shift assignment management
- Shift history tracking
- Shift statistics

### leaveRequest.service.js (Updated)
Now includes:
- Automatic leave-to-attendance integration
- Attendance status updates on leave approval

---

## Business Logic

### Overtime Calculation
1. Total work hours = Sum of all time tracking records for the day
2. Shift duration = Calculated from shift start/end times minus break
3. Overtime hours = Max(0, total work hours - shift duration)
4. Overtime amount = Overtime hours × Overtime rate

### Attendance Status Determination
- **PRESENT**: Work hours ≥ 75% of shift duration
- **HALF_DAY**: Work hours < 75% of shift duration
- **ABSENT**: No clock-in records for the day
- **LEAVE**: Leave is approved for the day
- **WORK_FROM_HOME**: Marked as WFH status

### Report Generation
- Aggregates all attendance records for the month
- Calculates statistics (present, absent, leave days)
- Computes attendance percentage
- Sums total work hours and overtime hours

---

## Configuration

### Overtime Policies (Default)
```javascript
{
  name: "Standard OT",
  code: "STANDARD",
  dailyThreshold: 8,
  weeklyThreshold: 40,
  overtimeRate: 1.5,
  weekendRate: 2,
  holidayRate: 2.5
}
```

### Shift Example (Default)
```javascript
{
  name: "Morning Shift",
  code: "MS",
  startTime: "09:00",
  endTime: "17:00",
  breakDuration: 60,
  workingDays: "1,2,3,4,5"  // Mon-Fri
}
```

---

## Usage Guide

### For Employees

#### 1. Clock In/Out
1. Navigate to Attendance Dashboard
2. Go to "Clock In/Out" tab
3. Click "Clock In" when arriving
4. Click "Clock Out" when leaving
5. Location tracking is automatic

#### 2. View Shifts
1. Go to "Shift Management" tab
2. View current assigned shift
3. See shift history
4. Request shift changes (if enabled)

#### 3. Request Overtime
1. Go to "Overtime Tracking" tab
2. Click "Record Overtime"
3. Select date and hours
4. Choose overtime policy/type
5. Add reason
6. Submit for approval

#### 4. View Reports
1. Go to "Attendance Reports" tab
2. Select report type (Employee/Team)
3. Choose month and year
4. View charts and statistics
5. Download PDF if needed

### For Managers/HR

#### 1. Manage Shifts
- Create shifts with specific start/end times
- Assign shifts to employees
- Track shift assignments
- View shift statistics

#### 2. Approve Overtime
- Review pending overtime requests
- Approve or reject with comments
- Track approved overtime

#### 3. Generate Reports
- Generate individual employee reports
- Generate team/department reports
- Analyze attendance trends
- Export reports for payroll

---

## Integration Notes

### With Leave Management
- Leave requests automatically update attendance records when approved
- Prevents double-counting of leaves as absent days
- Maintains audit trail in LeaveIntegration table

### With Payroll
- Work hours from TimeTracking feed into payroll calculations
- Overtime hours tracked separately for OT pay calculations
- Attendance reports provide data for salary deductions (absences)

### With Notifications
- Employees notified on successful clock in/out
- Managers notified of new overtime requests
- Employees notified of overtime approval/rejection

---

## Permissions Required

- `admin`: Full access to all attendance features
- `hr`: Can manage shifts, approve overtime, generate reports
- `manager`: Can view team attendance and reports
- `employee`: Can clock in/out, view own reports

---

## Future Enhancements

1. **Geofencing** - Restrict clock-in to office location
2. **Mobile App** - Native mobile clock in/out
3. **Biometric Integration** - Integration with biometric systems
4. **Advanced Analytics** - Predictive analytics for attendance
5. **Leave Encashment** - Calculate unused leave compensation
6. **Shift Swaps** - Employee shift swap requests
7. **Late Coming Policy** - Automatic late-coming tracking
8. **Remote Work Tracking** - Dedicated WFH hour tracking

---

## Troubleshooting

### Clock In/Out Issues
- Ensure employee record exists in system
- Check tenant ID configuration
- Verify location permissions on browser

### Report Generation
- Ensure attendance records exist for the month
- Check date range selection
- Verify employee is assigned to department

### Overtime Calculation
- Verify shift is assigned to employee for the date
- Check OvertimePolicy is active and assigned
- Ensure time tracking records exist for the date

---

## File Locations

**Backend:**
- Database Schema: `backend/prisma/schema.prisma`
- Service: `backend/src/modules/hr/attendance.service.js`
- Controller: `backend/src/modules/hr/attendance.controller.js`
- Routes: `backend/src/modules/hr/attendance.routes.js`
- Shift Service: `backend/src/modules/hr/shift.service.js`
- Shift Controller: `backend/src/modules/hr/shift.controller.js`

**Frontend:**
- Main Dashboard: `frontend/src/pages/hr/AttendanceDashboard.jsx`
- Clock In/Out: `frontend/src/pages/hr/ClockInOut.jsx`
- Shift Management: `frontend/src/pages/hr/ShiftManagement.jsx`
- Overtime Tracking: `frontend/src/pages/hr/OvertimeTracking.jsx`
- Reports: `frontend/src/pages/hr/AttendanceReports.jsx`
- Index: `frontend/src/pages/hr/index.js`

**Migration:**
- Migration: `backend/prisma/migrations/20260202024121_add_attendance_time_tracking/`

---

## Support & Documentation

For more information or issues, refer to:
- API Documentation
- HR Module Documentation
- System Requirements
