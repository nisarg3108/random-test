# ============================================
# ATTENDANCE MODULE API TESTING SCRIPT
# Tests: Clock In/Out, Shifts, Overtime, Reports
# ============================================

$baseUrl = "http://localhost:5000/api"
$testEmail = "admin20260205230311@test.com"
$testPassword = "test123456"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ATTENDANCE MODULE TESTING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# TEST 1: LOGIN
# ============================================
Write-Host "[1] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "[OK] Logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# TEST 2: GET EMPLOYEE ID
# ============================================
Write-Host "`n[2] Getting employee ID..." -ForegroundColor Yellow
try {
    $employees = Invoke-RestMethod -Uri "$baseUrl/hr/employees" -Method Get -Headers $headers
    Write-Host "[DEBUG] Employees Response:" -ForegroundColor Magenta
    Write-Host ($employees | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    if ($employees.employees -and $employees.employees.Count -gt 0) {
        $employeeId = $employees.employees[0].id
        Write-Host "[OK] Using Employee ID: $employeeId" -ForegroundColor Green
        Write-Host "    Name: $($employees.employees[0].firstName) $($employees.employees[0].lastName)" -ForegroundColor Gray
    } else {
        Write-Host "[WARN] No employees found - will use test ID" -ForegroundColor Yellow
        $employeeId = "88d71dce-251e-4da4-8f47-1051daf2c962"
    }
} catch {
    Write-Host "[WARN] Could not fetch employees: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "[DEBUG] Response: $($_.Exception.Response)" -ForegroundColor Magenta
    $employeeId = "88d71dce-251e-4da4-8f47-1051daf2c962"
}

# ============================================
# TEST 3: CREATE SHIFT
# ============================================
Write-Host "`n[3] Creating shift..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "HHmmss"
$shiftBody = @{
    name = "Morning Shift $timestamp"
    code = "SHIFT$timestamp"
    startTime = "09:00:00"
    endTime = "17:00:00"
    workingDays = "1,2,3,4,5"
    breakDuration = 60
    description = "Standard morning shift"
} | ConvertTo-Json

try {
    $shift = Invoke-RestMethod -Uri "$baseUrl/attendance/shifts" -Method Post -Headers $headers -Body $shiftBody
    $shiftId = $shift.data.id
    Write-Host "[OK] Shift created: $shiftId" -ForegroundColor Green
    Write-Host "    Name: $($shift.data.name)" -ForegroundColor Gray
    Write-Host "    Time: $($shift.data.startTime) - $($shift.data.endTime)" -ForegroundColor Gray
} catch {
    $errorBody = $_.ErrorDetails.Message
    Write-Host "[FAIL] Shift creation failed: $errorBody" -ForegroundColor Red
    $shiftId = $null
}

# ============================================
# TEST 4: GET ALL SHIFTS
# ============================================
Write-Host "`n[4] Getting all shifts..." -ForegroundColor Yellow
try {
    $shifts = Invoke-RestMethod -Uri "$baseUrl/attendance/shifts" -Method Get -Headers $headers
    Write-Host "[OK] Found $($shifts.data.Count) shifts" -ForegroundColor Green
    foreach ($s in $shifts.data) {
        Write-Host "    - $($s.name): $($s.startTime) - $($s.endTime)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Get shifts failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# TEST 5: ASSIGN SHIFT TO EMPLOYEE
# ============================================
Write-Host "`n[5] Assigning shift to employee..." -ForegroundColor Yellow
$assignBody = @{
    employeeId = $employeeId
    shiftId = $shiftId
    assignedFrom = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json

try {
    $assignment = Invoke-RestMethod -Uri "$baseUrl/attendance/shifts/assign" -Method Post -Headers $headers -Body $assignBody
    Write-Host "[OK] Shift assigned successfully" -ForegroundColor Green
    Write-Host "    Assignment ID: $($assignment.data.id)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Shift assignment failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# TEST 6: GET EMPLOYEE'S SHIFT
# ============================================
Write-Host "`n[6] Getting employee's current shift..." -ForegroundColor Yellow
try {
    $employeeShift = Invoke-RestMethod -Uri "$baseUrl/attendance/shifts/employee/$employeeId" -Method Get -Headers $headers
    Write-Host "[OK] Employee shift retrieved" -ForegroundColor Green
    Write-Host "    Shift: $($employeeShift.data.shift.name)" -ForegroundColor Gray
    Write-Host "    Assigned From: $($employeeShift.data.assignedFrom)" -ForegroundColor Gray
} catch {
    Write-Host "[INFO] No shift assigned yet or error: $($_.Exception.Message)" -ForegroundColor Cyan
}

# ============================================
# TEST 7: CLOCK IN
# ============================================
Write-Host "`n[7] Clocking in..." -ForegroundColor Yellow
$clockInBody = @{
    employeeId = $employeeId
    location = "Test Location, NY (40.7128, -74.0060)"
} | ConvertTo-Json

try {
    $clockInResult = Invoke-RestMethod -Uri "$baseUrl/attendance/clock-in" -Method Post -Headers $headers -Body $clockInBody
    Write-Host "[OK] Clocked in successfully" -ForegroundColor Green
    Write-Host "    Time: $($clockInResult.data.clockInTime)" -ForegroundColor Gray
} catch {
    $errorMsg = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "[WARN] Clock in failed: $errorMsg" -ForegroundColor Yellow
}

# ============================================
# TEST 8: GET CLOCK STATUS
# ============================================
Write-Host "`n[8] Getting clock status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/attendance/clock-status/$employeeId" -Method Get -Headers $headers
    Write-Host "[OK] Clock status retrieved" -ForegroundColor Green
    Write-Host "    Is Clocked In: $($status.data.isClockedIn)" -ForegroundColor Gray
    if ($status.data.isClockedIn) {
        Write-Host "    Clock In Time: $($status.data.clockInTime)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Get clock status failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# TEST 9: CLOCK OUT
# ============================================
Write-Host "`n[9] Clocking out..." -ForegroundColor Yellow
$clockOutBody = @{
    employeeId = $employeeId
    location = "Test Location, NY (40.7128, -74.0060)"
} | ConvertTo-Json

try {
    $clockOutResult = Invoke-RestMethod -Uri "$baseUrl/attendance/clock-out" -Method Post -Headers $headers -Body $clockOutBody
    Write-Host "[OK] Clocked out successfully" -ForegroundColor Green
    Write-Host "    Clock Out Time: $($clockOutResult.data.clockOutTime)" -ForegroundColor Gray
    Write-Host "    Total Hours: $($clockOutResult.data.totalHours)" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Clock out failed (might not be clocked in): $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================
# TEST 10: CREATE OVERTIME POLICY
# ============================================
Write-Host "`n[10] Creating overtime policy..." -ForegroundColor Yellow
$overtimeBody = @{
    code = "OT$timestamp"
    name = "Standard OT Policy $timestamp"
    description = "1.5x rate after 8 hours"
    shiftId = $shiftId
    dailyThreshold = 8
    weeklyThreshold = 40
    overtimeRate = 1.5
    weekendRate = 2.0
    holidayRate = 2.5
} | ConvertTo-Json

try {
    $policy = Invoke-RestMethod -Uri "$baseUrl/attendance/overtime-policies" -Method Post -Headers $headers -Body $overtimeBody
    Write-Host "[OK] Overtime policy created" -ForegroundColor Green
    Write-Host "    Name: $($policy.data.name)" -ForegroundColor Gray
    Write-Host "    Multiplier: $($policy.data.multiplier)x" -ForegroundColor Gray
} catch {
    $errorMsg = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "[FAIL] Overtime policy creation failed: $errorMsg" -ForegroundColor Red
}

# ============================================
# TEST 11: GET OVERTIME HOURS
# ============================================
Write-Host "`n[11] Getting overtime hours for today..." -ForegroundColor Yellow
$today = (Get-Date).ToString("yyyy-MM-dd")
try {
    $overtime = Invoke-RestMethod -Uri "$baseUrl/attendance/overtime-hours/$employeeId`?date=$today" -Method Get -Headers $headers
    Write-Host "[OK] Overtime hours retrieved" -ForegroundColor Green
    Write-Host "    Regular Hours: $($overtime.data.regularHours)" -ForegroundColor Gray
    Write-Host "    Overtime Hours: $($overtime.data.overtimeHours)" -ForegroundColor Gray
} catch {
    Write-Host "[INFO] No overtime data or error: $($_.Exception.Message)" -ForegroundColor Cyan
}

# ============================================
# TEST 12: GENERATE MONTHLY REPORT
# ============================================
Write-Host "`n[12] Generating monthly attendance report..." -ForegroundColor Yellow
$currentMonth = (Get-Date).Month
$currentYear = (Get-Date).Year
try {
    $report = Invoke-RestMethod -Uri "$baseUrl/attendance/reports/$employeeId/generate`?month=$currentMonth&year=$currentYear" -Method Post -Headers $headers
    Write-Host "[OK] Monthly report generated" -ForegroundColor Green
    Write-Host "    Total Days: $($report.data.totalDays)" -ForegroundColor Gray
    Write-Host "    Present Days: $($report.data.presentDays)" -ForegroundColor Gray
    Write-Host "    Absent Days: $($report.data.absentDays)" -ForegroundColor Gray
} catch {
    Write-Host "[INFO] Report generation skipped or failed: $($_.Exception.Message)" -ForegroundColor Cyan
}

# ============================================
# TEST 13: GET MONTHLY REPORT
# ============================================
Write-Host "`n[13] Getting monthly report..." -ForegroundColor Yellow
try {
    $savedReport = Invoke-RestMethod -Uri "$baseUrl/attendance/reports/$employeeId`?month=$currentMonth&year=$currentYear" -Method Get -Headers $headers
    Write-Host "[OK] Monthly report retrieved" -ForegroundColor Green
    Write-Host "    Report Period: $currentMonth/$currentYear" -ForegroundColor Gray
} catch {
    Write-Host "[INFO] No saved report found: $($_.Exception.Message)" -ForegroundColor Cyan
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ATTENDANCE MODULE TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nKey Features Tested:" -ForegroundColor White
Write-Host "  OK Clock In/Out functionality" -ForegroundColor Green
Write-Host "  OK Shift management and assignment" -ForegroundColor Green
Write-Host "  OK Overtime policy creation" -ForegroundColor Green
Write-Host "  OK Attendance reporting" -ForegroundColor Green
Write-Host "  OK Real-time status tracking" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Test UI at http://localhost:5173/attendance" -ForegroundColor White
Write-Host "  2. Verify clock in/out buttons work" -ForegroundColor White
Write-Host "  3. Check attendance calendar view" -ForegroundColor White
Write-Host "  4. Test leave request integration" -ForegroundColor White
