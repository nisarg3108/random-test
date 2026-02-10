# 🧪 API Testing Guide - Quick Start

## ✅ Test Data Ready!

Your database now has test data ready for API testing.

### 📋 Test IDs

```powershell
# Copy and paste these into PowerShell:
$projectId = "b0faf6c6-921f-4486-b381-370590b2f7d5"
$employeeId = "9e37e3f6-2350-406d-8fa1-22e7f9a6ad45"
$userId = "d4558d36-7a8f-40bf-9b65-d51598ff0b4f"
$tenantId = "c3c0c484-00f4-4975-8f9a-1db32ca3e5c5"
$baseUrl = "http://localhost:5000/api"
```

### 🔐 Step 1: Get Authentication Token

First, login to get your JWT token:

```powershell
# Login request
$loginBody = @{
    email = "mit@gmail.com"
    password = "your-password-here"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

# Save the token
$token = $loginResponse.token
Write-Host "✅ Token received: $($token.Substring(0, 20))..."

# Create headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
```

### 🧪 Step 2: Test Project Member APIs

#### Test 1: Add Member to Project

```powershell
# Add team member with 50% allocation
$memberBody = @{
    employeeId = $employeeId
    role = "Backend Developer"
    allocationPercent = 50
    startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    responsibilities = "Implement Project Management APIs and database schema"
} | ConvertTo-Json

$addMemberResponse = Invoke-RestMethod `
    -Uri "$baseUrl/projects/$projectId/members" `
    -Method POST `
    -Headers $headers `
    -Body $memberBody

Write-Host "✅ Member added:" -ForegroundColor Green
$addMemberResponse | ConvertTo-Json -Depth 3
$memberId = $addMemberResponse.id
```

#### Test 2: Check Employee Availability

```powershell
# Check how much capacity the employee has available
$startDate = (Get-Date).ToString("yyyy-MM-dd")
$availResponse = Invoke-RestMethod `
    -Uri "$baseUrl/projects/employees/$employeeId/availability?startDate=$startDate" `
    -Headers $headers

Write-Host "✅ Employee Availability:" -ForegroundColor Green
Write-Host "   Current Allocation: $($availResponse.currentAllocation)%"
Write-Host "   Available Capacity: $($availResponse.availablePercent)%"
Write-Host "   Active Projects: $($availResponse.projects.Count)"
```

#### Test 3: Try to Overallocate (Should Fail)

```powershell
# Try to add same employee with 60% allocation (total would be 110%)
$overallocBody = @{
    employeeId = $employeeId
    role = "Frontend Developer"
    allocationPercent = 60
    startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "$baseUrl/projects/$projectId/members" `
        -Method POST `
        -Headers $headers `
        -Body $overallocBody
    Write-Host "❌ FAIL: Should have rejected overallocation" -ForegroundColor Red
} catch {
    Write-Host "✅ PASS: Correctly rejected overallocation" -ForegroundColor Green
    Write-Host "   Error: $($_.ErrorDetails.Message)"
}
```

#### Test 4: Get Project Team Capacity

```powershell
# Get overall team capacity metrics
$capacityResponse = Invoke-RestMethod `
    -Uri "$baseUrl/projects/$projectId/members/capacity" `
    -Headers $headers

Write-Host "✅ Team Capacity:" -ForegroundColor Green
$capacityResponse | ConvertTo-Json -Depth 2
```

#### Test 5: List Project Members

```powershell
# Get all members of the project
$membersResponse = Invoke-RestMethod `
    -Uri "$baseUrl/projects/$projectId/members" `
    -Headers $headers

Write-Host "✅ Project Members ($($membersResponse.Count)):" -ForegroundColor Green
$membersResponse | ForEach-Object {
    Write-Host "   - $($_.role): $($_.allocationPercent)% allocated"
}
```

### 📅 Step 3: Test Timesheet APIs

#### Test 1: Get or Create Timesheet for Current Week

```powershell
# Get timesheet for current week (creates if doesn't exist)
$weekStart = (Get-Date -Day ((Get-Date).Day - (Get-Date).DayOfWeek.value__ + 1)).ToString("yyyy-MM-dd")
$timesheetResponse = Invoke-RestMethod `
    -Uri "$baseUrl/timesheets/get-or-create?employeeId=$employeeId&weekStartDate=$weekStart" `
    -Headers $headers

Write-Host "✅ Timesheet:" -ForegroundColor Green
Write-Host "   ID: $($timesheetResponse.id)"
Write-Host "   Week: $($timesheetResponse.weekStartDate) to $($timesheetResponse.weekEndDate)"
Write-Host "   Status: $($timesheetResponse.status)"
$timesheetId = $timesheetResponse.id
```

#### Test 2: Try to Submit Empty Timesheet (Should Fail)

```powershell
# Try to submit timesheet without any time entries
try {
    Invoke-RestMethod `
        -Uri "$baseUrl/timesheets/$timesheetId/submit" `
        -Method POST `
        -Headers $headers
    Write-Host "❌ FAIL: Should have rejected empty timesheet" -ForegroundColor Red
} catch {
    Write-Host "✅ PASS: Correctly rejected empty timesheet" -ForegroundColor Green
    Write-Host "   Error: $($_.ErrorDetails.Message)"
}
```

#### Test 3: Add Time Logs (Using existing time log API)

```powershell
# Note: You'll need to add time logs first using the existing time log API
# POST /api/projects/time-logs
# Then the timesheet will have entries to submit
```

#### Test 4: Get My Timesheets

```powershell
# Get all timesheets for the employee
$myTimesheetsResponse = Invoke-RestMethod `
    -Uri "$baseUrl/timesheets/employees/$employeeId" `
    -Headers $headers

Write-Host "✅ My Timesheets ($($myTimesheetsResponse.Count)):" -ForegroundColor Green
$myTimesheetsResponse | ForEach-Object {
    Write-Host "   - Week of $($_.weekStartDate): $($_.status) - $($_.totalHours) hours"
}
```

#### Test 5: Get Timesheet Summary

```powershell
# Get summary statistics for all timesheets
$summaryResponse = Invoke-RestMethod `
    -Uri "$baseUrl/timesheets/summary" `
    -Headers $headers

Write-Host "✅ Timesheet Summary:" -ForegroundColor Green
$summaryResponse | ConvertTo-Json -Depth 2
```

#### Test 6: Get Pending Approvals (If you're a manager)

```powershell
# Get timesheets waiting for approval
$pendingResponse = Invoke-RestMethod `
    -Uri "$baseUrl/timesheets/pending-approvals" `
    -Headers $headers

Write-Host "✅ Pending Approvals ($($pendingResponse.Count)):" -ForegroundColor Green
$pendingResponse | ForEach-Object {
    Write-Host "   - Employee: $($_.employeeId), Week: $($_.weekStartDate)"
}
```

### 🔄 Complete Workflow Test

Here's a complete workflow testing all major features:

```powershell
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🧪 COMPLETE WORKFLOW TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Add team member
Write-Host "1️⃣  Adding team member..." -ForegroundColor Yellow
$member = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members" `
    -Method POST -Headers $headers `
    -Body (@{employeeId=$employeeId; role="Developer"; allocationPercent=40; startDate=(Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")} | ConvertTo-Json)
Write-Host "   ✅ Member added with 40% allocation`n" -ForegroundColor Green

# 2. Check availability
Write-Host "2️⃣  Checking availability..." -ForegroundColor Yellow
$avail = Invoke-RestMethod -Uri "$baseUrl/projects/employees/$employeeId/availability?startDate=$(Get-Date -Format yyyy-MM-dd)" -Headers $headers
Write-Host "   ✅ Available: $($avail.availablePercent)%`n" -ForegroundColor Green

# 3. Get team capacity
Write-Host "3️⃣  Getting team capacity..." -ForegroundColor Yellow
$capacity = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members/capacity" -Headers $headers
Write-Host "   ✅ Total allocation: $($capacity.totalAllocation)%`n" -ForegroundColor Green

# 4. Get/create timesheet
Write-Host "4️⃣  Getting timesheet..." -ForegroundColor Yellow
$weekStart = (Get-Date -Day ((Get-Date).Day - (Get-Date).DayOfWeek.value__ + 1)).ToString("yyyy-MM-dd")
$timesheet = Invoke-RestMethod -Uri "$baseUrl/timesheets/get-or-create?employeeId=$employeeId&weekStartDate=$weekStart" -Headers $headers
Write-Host "   ✅ Timesheet: $($timesheet.status)`n" -ForegroundColor Green

# 5. Get my timesheets
Write-Host "5️⃣  Getting my timesheets..." -ForegroundColor Yellow
$myTimesheets = Invoke-RestMethod -Uri "$baseUrl/timesheets/employees/$employeeId" -Headers $headers
Write-Host "   ✅ Found $($myTimesheets.Count) timesheets`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
```

### 📊 Verify in Database

After testing, you can verify the data was created:

```sql
-- Check project members
SELECT * FROM "ProjectMember" WHERE "projectId" = 'b0faf6c6-921f-4486-b381-370590b2f7d5';

-- Check timesheets
SELECT * FROM "ProjectTimesheet" WHERE "employeeId" = '9e37e3f6-2350-406d-8fa1-22e7f9a6ad45';

-- Check audit logs
SELECT * FROM "AuditLog" WHERE entity IN ('PROJECT_MEMBER', 'PROJECT_TIMESHEET') ORDER BY "createdAt" DESC LIMIT 10;
```

### 🐛 Troubleshooting

**Issue: 401 Unauthorized**
- Check that your token is valid
- Token might be expired (7 days by default)
- Re-login to get a new token

**Issue: 404 Not Found**
- Verify the IDs are correct
- Check that the project/employee exists in database

**Issue: 400 Bad Request**
- Check request body format
- Ensure all required fields are provided
- Validate date formats (ISO 8601)

**Issue: 403 Forbidden**
- User doesn't have required permissions
- Check RBAC role assignments
- Admin users bypass all permission checks

### 📚 Next Steps

1. ✅ Test all endpoints with the scripts above
2. ✅ Verify data in database
3. ✅ Check audit logs are created
4. ✅ Test error scenarios (overallocation, empty timesheet, etc.)
5. 🔜 Move to Week 2: Frontend implementation

---

**Server Status:** Backend running on http://localhost:5000  
**Documentation:** See [PROJECT_MANAGEMENT_API_TEST_REPORT.md](PROJECT_MANAGEMENT_API_TEST_REPORT.md)
