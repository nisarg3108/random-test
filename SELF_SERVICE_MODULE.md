# Employee Self-Service Module

## Overview
The Self-Service module provides common features accessible to all authenticated users regardless of their role. This ensures every employee can access their personal information like salary, payslips, leave balance, and attendance.

## Features

### 1. My Salary (`/my-salary`)
- View current salary structure (basic salary, allowances, deductions)
- View net salary and effective date
- Access payslip history
- Download payslips as text files

**Accessible to:** All authenticated users

### 2. My Leave (`/my-leave`)
- View leave balance for all leave types
- See remaining leave days
- Submit new leave requests
- View leave request history with status
- Track approved, pending, and rejected leaves

**Accessible to:** All authenticated users

### 3. My Attendance (`/my-attendance`)
- View monthly attendance summary
- See present, absent, and leave days
- Track total work hours and overtime
- View daily attendance records with check-in/check-out times
- Calculate attendance rate percentage

**Accessible to:** All authenticated users

## Backend API Endpoints

### Base URL: `/api/self-service`

All endpoints require authentication via JWT token.

#### 1. Get My Salary Info
```
GET /api/self-service/salary
```
Returns employee's current salary structure including basic salary, allowances, and deductions.

#### 2. Get My Payslips
```
GET /api/self-service/payslips?limit=12
```
Returns list of payslips for the authenticated user.

#### 3. Download Payslip
```
GET /api/self-service/payslips/:id
```
Returns detailed payslip information for download.

#### 4. Get My Leave Balance
```
GET /api/self-service/leave-balance
```
Returns leave balance for all leave types including total, used, and remaining days.

#### 5. Get My Attendance Summary
```
GET /api/self-service/attendance-summary?month=1&year=2026
```
Returns attendance summary for specified month and year.

## Frontend Components

### Pages Location
`frontend/src/pages/self-service/`

- `MySalary.jsx` - Salary and payslip management
- `MyLeave.jsx` - Leave requests and balance
- `MyAttendance.jsx` - Attendance tracking

### API Client
`frontend/src/api/selfService.js`

Provides methods to interact with self-service endpoints.

## Usage

### For Employees
1. Navigate to "My Salary" to view salary details and download payslips
2. Navigate to "My Leave" to request leave and check balance
3. Navigate to "My Attendance" to view attendance records

### For Administrators
These pages are accessible to all roles including:
- USER
- MANAGER
- ADMIN
- HR_MANAGER
- FINANCE_MANAGER
- etc.

No special permissions required - only authentication.

## Integration

### Adding to Navigation
Add these links to your navigation menu:

```jsx
<Link to="/my-salary">My Salary</Link>
<Link to="/my-leave">My Leave</Link>
<Link to="/my-attendance">My Attendance</Link>
```

### Required Setup
1. Employee profile must be linked to user account
2. Salary structure must be configured for the employee
3. Leave types must be defined in the system
4. Attendance records should be maintained

## Security
- All endpoints require authentication
- Users can only access their own data
- Employee profile is automatically linked via userId
- No role-based restrictions (available to all authenticated users)

## Future Enhancements
- PDF generation for payslips
- Email notifications for leave approvals
- Mobile app integration
- Biometric attendance integration
- Leave calendar view
- Salary comparison charts
- Export attendance reports
