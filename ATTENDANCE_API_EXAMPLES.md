# Attendance & Time Tracking - API Examples

## Authentication
All endpoints require the `authenticate` middleware. Include Bearer token in header:
```
Authorization: Bearer <token>
```

---

## Clock In/Out Examples

### 1. Clock In
**Endpoint**: `POST /api/attendance/clock-in`

**Request**:
```json
{
  "employeeId": "emp-123",
  "location": "40.7128,-74.0060"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Clock in successful",
  "data": {
    "id": "track-123",
    "employeeId": "emp-123",
    "tenantId": "tenant-123",
    "date": "2026-02-02T00:00:00Z",
    "checkInTime": "2026-02-02T09:15:00Z",
    "checkOutTime": null,
    "checkInLocation": "40.7128,-74.0060",
    "status": "CHECKED_IN",
    "createdAt": "2026-02-02T09:15:00Z"
  }
}
```

---

### 2. Clock Out
**Endpoint**: `POST /api/attendance/clock-out`

**Request**:
```json
{
  "employeeId": "emp-123",
  "location": "40.7128,-74.0060"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Clock out successful",
  "data": {
    "id": "track-123",
    "employeeId": "emp-123",
    "date": "2026-02-02T00:00:00Z",
    "checkInTime": "2026-02-02T09:15:00Z",
    "checkOutTime": "2026-02-02T17:30:00Z",
    "workHours": 8.25,
    "overtimeHours": 0.25,
    "status": "CHECKED_OUT",
    "updatedAt": "2026-02-02T17:30:00Z"
  }
}
```

---

### 3. Get Clock Status
**Endpoint**: `GET /api/attendance/clock-status/:employeeId`

**Response**:
```json
{
  "success": true,
  "data": {
    "isClocked": true,
    "clockedIn": "2026-02-02T09:15:00Z",
    "elapsedHours": 8.25
  }
}
```

---

## Shift Management Examples

### 1. Create Shift
**Endpoint**: `POST /api/attendance/shifts`

**Request**:
```json
{
  "name": "Morning Shift",
  "code": "MS",
  "startTime": "09:00",
  "endTime": "17:00",
  "breakDuration": 60,
  "workingDays": "1,2,3,4,5",
  "description": "Standard morning shift"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Shift created successfully",
  "data": {
    "id": "shift-123",
    "tenantId": "tenant-123",
    "name": "Morning Shift",
    "code": "MS",
    "startTime": "09:00",
    "endTime": "17:00",
    "breakDuration": 60,
    "workingDays": "1,2,3,4,5",
    "isActive": true,
    "createdAt": "2026-02-02T09:00:00Z"
  }
}
```

---

### 2. Assign Shift to Employee
**Endpoint**: `POST /api/attendance/shifts/assign`

**Request**:
```json
{
  "employeeId": "emp-123",
  "shiftId": "shift-123",
  "assignedFrom": "2026-02-01T00:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Shift assigned successfully",
  "data": {
    "id": "assign-123",
    "employeeId": "emp-123",
    "shiftId": "shift-123",
    "tenantId": "tenant-123",
    "assignedFrom": "2026-02-01T00:00:00Z",
    "assignedTo": null,
    "status": "ACTIVE",
    "shift": {
      "id": "shift-123",
      "name": "Morning Shift",
      "startTime": "09:00",
      "endTime": "17:00",
      "breakDuration": 60
    },
    "createdAt": "2026-02-02T09:00:00Z"
  }
}
```

---

### 3. Get Employee's Current Shift
**Endpoint**: `GET /api/attendance/shifts/employee/:employeeId`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "shift-123",
    "name": "Morning Shift",
    "code": "MS",
    "startTime": "09:00",
    "endTime": "17:00",
    "breakDuration": 60,
    "workingDays": "1,2,3,4,5"
  }
}
```

---

### 4. Get All Shifts
**Endpoint**: `GET /api/attendance/shifts`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "shift-123",
      "name": "Morning Shift",
      "code": "MS",
      "startTime": "09:00",
      "endTime": "17:00",
      "breakDuration": 60,
      "isActive": true,
      "shiftAssignments": [
        {
          "id": "assign-123",
          "employeeId": "emp-123",
          "employee": {
            "id": "emp-123",
            "name": "John Doe"
          }
        }
      ]
    },
    {
      "id": "shift-124",
      "name": "Evening Shift",
      "code": "ES",
      "startTime": "14:00",
      "endTime": "22:00",
      "breakDuration": 60,
      "isActive": true,
      "shiftAssignments": []
    }
  ]
}
```

---

## Overtime Examples

### 1. Create Overtime Policy
**Endpoint**: `POST /api/attendance/overtime-policies`

**Request**:
```json
{
  "name": "Standard OT",
  "code": "STANDARD",
  "dailyThreshold": 8,
  "weeklyThreshold": 40,
  "overtimeRate": 1.5,
  "weekendRate": 2,
  "holidayRate": 2.5,
  "description": "Standard overtime policy"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Overtime policy created successfully",
  "data": {
    "id": "policy-123",
    "tenantId": "tenant-123",
    "name": "Standard OT",
    "code": "STANDARD",
    "dailyThreshold": 8,
    "weeklyThreshold": 40,
    "overtimeRate": 1.5,
    "weekendRate": 2,
    "holidayRate": 2.5,
    "isActive": true,
    "createdAt": "2026-02-02T09:00:00Z"
  }
}
```

---

### 2. Calculate Overtime Hours
**Endpoint**: `GET /api/attendance/overtime-hours/:employeeId?date=2026-02-02`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalWorkHours": 8.5,
    "shiftDuration": 8,
    "overtimeHours": 0.5
  }
}
```

---

### 3. Record Overtime
**Endpoint**: `POST /api/attendance/overtime-records/:employeeId`

**Request**:
```json
{
  "overtimePolicyId": "policy-123",
  "overtimeHours": 2,
  "date": "2026-02-02",
  "dailyRate": 500,
  "reason": "Project deadline"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Overtime recorded successfully",
  "data": {
    "id": "otrecord-123",
    "employeeId": "emp-123",
    "overtimePolicyId": "policy-123",
    "tenantId": "tenant-123",
    "date": "2026-02-02T00:00:00Z",
    "overtimeHours": 2,
    "overtimeRate": 1.5,
    "overtimeAmount": 1000,
    "reason": "Project deadline",
    "approvalStatus": "PENDING",
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2026-02-02T17:30:00Z"
  }
}
```

---

### 4. Approve Overtime
**Endpoint**: `PUT /api/attendance/overtime-records/:overtimeRecordId/approve`

**Request**:
```json
{
  "approvedBy": "manager-123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Overtime approved successfully",
  "data": {
    "id": "otrecord-123",
    "employeeId": "emp-123",
    "overtimeHours": 2,
    "approvalStatus": "APPROVED",
    "approvedBy": "manager-123",
    "approvedAt": "2026-02-02T18:00:00Z"
  }
}
```

---

## Attendance Reports Examples

### 1. Generate Monthly Report
**Endpoint**: `POST /api/attendance/reports/:employeeId/generate?month=2&year=2026`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "report-123",
    "employeeId": "emp-123",
    "tenantId": "tenant-123",
    "month": 2,
    "year": 2026,
    "reportDate": "2026-02-02T09:00:00Z",
    "totalWorkingDays": 20,
    "presentDays": 18,
    "absentDays": 1,
    "leaveDays": 1,
    "halfDays": 0,
    "workFromHomeDays": 0,
    "totalWorkHours": 144.5,
    "totalOvertimeHours": 4.5,
    "attendancePercentage": 90,
    "status": "GENERATED",
    "createdAt": "2026-02-02T09:00:00Z"
  }
}
```

---

### 2. Get Monthly Report
**Endpoint**: `GET /api/attendance/reports/:employeeId?month=2&year=2026`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "report-123",
    "employeeId": "emp-123",
    "month": 2,
    "year": 2026,
    "totalWorkingDays": 20,
    "presentDays": 18,
    "absentDays": 1,
    "leaveDays": 1,
    "halfDays": 0,
    "workFromHomeDays": 0,
    "totalWorkHours": 144.5,
    "totalOvertimeHours": 4.5,
    "attendancePercentage": 90,
    "employee": {
      "id": "emp-123",
      "name": "John Doe",
      "email": "john@company.com",
      "department": {
        "id": "dept-123",
        "name": "Engineering"
      }
    }
  }
}
```

---

### 3. Get Team/Department Report
**Endpoint**: `GET /api/attendance/reports/department/:departmentId?month=2&year=2026`

**Response**:
```json
{
  "success": true,
  "data": {
    "department": "dept-123",
    "month": 2,
    "year": 2026,
    "summary": {
      "totalEmployees": 15,
      "averageAttendance": "92.33",
      "totalWorkHours": "2160.00",
      "totalOvertimeHours": "48.50"
    },
    "reports": [
      {
        "id": "report-123",
        "employee": {
          "id": "emp-123",
          "name": "John Doe"
        },
        "presentDays": 18,
        "absentDays": 1,
        "leaveDays": 1,
        "attendancePercentage": 90,
        "totalWorkHours": 144.5,
        "totalOvertimeHours": 4.5
      },
      // ... more employees
    ]
  }
}
```

---

## Leave Integration Examples

### 1. Integrate Leave with Attendance
**Endpoint**: `POST /api/attendance/leave-integration`

**Request**:
```json
{
  "leaveRequestId": "leave-123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Leave integrated with attendance successfully",
  "data": [
    {
      "id": "integration-123",
      "leaveRequestId": "leave-123",
      "employeeId": "emp-123",
      "tenantId": "tenant-123",
      "leaveDate": "2026-02-02T00:00:00Z",
      "status": "APPROVED",
      "attendanceStatus": "ON_LEAVE",
      "createdAt": "2026-02-02T09:00:00Z"
    },
    {
      "id": "integration-124",
      "leaveRequestId": "leave-123",
      "employeeId": "emp-123",
      "tenantId": "tenant-123",
      "leaveDate": "2026-02-03T00:00:00Z",
      "status": "APPROVED",
      "attendanceStatus": "ON_LEAVE",
      "createdAt": "2026-02-02T09:00:00Z"
    }
  ]
}
```

---

## Error Responses

### Clock In Already
```json
{
  "success": false,
  "message": "Employee is already clocked in for today"
}
```

### Employee Not Found
```json
{
  "success": false,
  "message": "Employee not found"
}
```

### Shift Not Assigned
```json
{
  "success": false,
  "message": "No active clock-in record found for today"
}
```

---

## cURL Examples

### Clock In
```bash
curl -X POST http://localhost:3000/api/attendance/clock-in \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp-123",
    "location": "40.7128,-74.0060"
  }'
```

### Create Shift
```bash
curl -X POST http://localhost:3000/api/attendance/shifts \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Shift",
    "code": "MS",
    "startTime": "09:00",
    "endTime": "17:00",
    "breakDuration": 60,
    "workingDays": "1,2,3,4,5"
  }'
```

### Get Attendance Report
```bash
curl -X GET "http://localhost:3000/api/attendance/reports/emp-123?month=2&year=2026" \
  -H "Authorization: Bearer your-token"
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Testing Checklist

- [ ] Clock in with location
- [ ] Clock out and verify work hours
- [ ] Create shift and assign to employee
- [ ] View employee's current shift
- [ ] Create overtime policy
- [ ] Record overtime and calculate hours
- [ ] Approve overtime request
- [ ] Generate attendance report
- [ ] Integrate leave with attendance
- [ ] Download attendance report PDF

---

End of API Examples
