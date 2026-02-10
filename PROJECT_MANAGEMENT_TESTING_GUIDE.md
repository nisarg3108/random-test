# 🧪 Project Management Testing Guide

**Testing Session**: February 10, 2026  
**Servers Status**: ✅ Both Running

---

## 🚀 Server Status

### Backend Server
- **URL**: http://localhost:5000
- **Status**: ✅ Running
- **Health Check**: http://localhost:5000/api/health
- **Terminal**: Background process

### Frontend Server
- **URL**: http://localhost:5174
- **Status**: ✅ Running (Vite dev server)
- **Browser**: Opened in VS Code Simple Browser
- **Terminal**: Background process

---

## 🧪 Testing Checklist

### 1. Login and Authentication
**Test Steps**:
1. Navigate to http://localhost:5174
2. Login with test credentials:
   - **Email**: `apitest@test.com`
   - **Password**: `Test@1234`
3. ✅ Verify successful login and redirect to dashboard

---

### 2. Project Management - Team Tab

**Navigation**: Dashboard → Projects → Select any project → **Team** tab

**Test Cases**:

#### TC-1: View Team Members
- [ ] Team capacity cards display (Total Members, Total Allocation, etc.)
- [ ] Team members table loads
- [ ] Status badges show correctly (ACTIVE, INACTIVE, COMPLETED)

#### TC-2: Add Team Member
- [ ] Click "Add Member" button
- [ ] Fill form:
  - Employee: Select from dropdown
  - Role: "Frontend Developer"
  - Allocation: 50%
  - Start Date: Today
- [ ] Submit and verify success message
- [ ] Check team member appears in list
- [ ] Verify capacity cards update

#### TC-3: Check Availability Before Adding
- [ ] Try to add same employee with 60% allocation
- [ ] Should show error: "Employee only has X% capacity available"
- [ ] Verify system prevents >100% allocation

#### TC-4: Edit Team Member
- [ ] Click edit icon (pencil) on a member
- [ ] Change allocation to 75%
- [ ] Save and verify update
- [ ] Check capacity cards reflect change

#### TC-5: Remove Team Member
- [ ] Click delete icon (trash) on a member
- [ ] Confirm removal
- [ ] Verify member removed from list
- [ ] Check capacity cards update

---

### 3. Project Management - Capacity Tab

**Navigation**: Dashboard → Projects → Select any project → **Capacity** tab

**Test Cases**:

#### TC-6: View Capacity Dashboard
- [ ] Overview cards display (Team Members, Total Allocation, Avg Allocation, Overallocated)
- [ ] Bar chart renders (Allocation vs Available per member)
- [ ] Pie chart renders (Allocation by Role)
- [ ] Detailed member table loads

#### TC-7: Check Utilization Status
- [ ] Verify color coding:
  - Green: Underutilized (<50%)
  - Blue: Optimal (50-80%)
  - Yellow: High (80-100%)
  - Red: Overallocated (>100%)
- [ ] Check status badges match allocation percentages

#### TC-8: Capacity Warnings
- [ ] If any member >100%, verify amber warning box appears
- [ ] Check warning lists overallocated employees
- [ ] Verify recommendation text shows

---

### 4. Timesheet Entry

**Navigation**: 
- Option 1: Direct URL → http://localhost:5174/projects/timesheet/entry
- Option 2: Add navigation link to sidebar (if implemented)

**Test Cases**:

#### TC-9: Create New Timesheet
- [ ] Page loads with current week (Monday-Sunday)
- [ ] Week navigation buttons work (Previous/Next)
- [ ] Status badge shows "DRAFT"
- [ ] Add entry form displays

#### TC-10: Add Time Entries
- [ ] Select Project: Choose "ERP-PM-001" (test project)
- [ ] Select Milestone: Choose from cascading dropdown
- [ ] Select Date: Choose date within current week
- [ ] Hours: Enter 8.0
- [ ] Task Description: "Testing timesheet entry feature"
- [ ] Billable: Check checkbox
- [ ] Click "Add Entry"
- [ ] Verify entry appears in table
- [ ] Check summary cards update (Total Hours, Billable Hours)

#### TC-11: Add Multiple Entries
- [ ] Add 3-4 different entries with varying hours
- [ ] Mix of billable and non-billable
- [ ] Different dates within the week
- [ ] Verify all appear in table
- [ ] Check total hours calculation

#### TC-12: Save Draft
- [ ] Click "Save Draft" button
- [ ] Verify success message
- [ ] Refresh page
- [ ] Check entries persist

#### TC-13: Remove Entry
- [ ] Click trash icon on an entry
- [ ] Verify entry removed
- [ ] Check summary updates

#### TC-14: Submit Timesheet
- [ ] Ensure at least one entry exists
- [ ] Click "Submit for Approval"
- [ ] Confirm submission
- [ ] Verify status changes to "SUBMITTED"
- [ ] Check form becomes read-only

#### TC-15: Empty Timesheet Validation
- [ ] Create new week timesheet (navigate to next week)
- [ ] Don't add any entries
- [ ] Try to submit
- [ ] Verify error: "Cannot submit an empty timesheet"

---

### 5. My Timesheets

**Navigation**: http://localhost:5174/projects/timesheet/my

**Test Cases**:

#### TC-16: View Timesheet History
- [ ] Summary cards display (Total, Approved, Pending, Total Hours)
- [ ] Timesheet list table loads
- [ ] Recently submitted timesheet appears
- [ ] Status badge shows correctly

#### TC-17: Filter by Status
- [ ] Click "ALL" - shows all timesheets
- [ ] Click "DRAFT" - shows only drafts
- [ ] Click "SUBMITTED" - shows only submitted
- [ ] Click "APPROVED" - shows only approved
- [ ] Click "REJECTED" - shows only rejected

#### TC-18: View Timesheet Details
- [ ] Click "View" button on a timesheet
- [ ] Navigates to TimesheetEntry page
- [ ] Loads selected week
- [ ] Shows correct entries

---

### 6. Timesheet Approvals (Manager View)

**Navigation**: http://localhost:5174/projects/timesheet/approvals

**Requirements**: Need TIMESHEET_APPROVE permission
- Login as manager or admin user

**Test Cases**:

#### TC-19: View Pending Approvals
- [ ] Summary cards display (Pending, Total Hours, Employees)
- [ ] Pending timesheets table loads
- [ ] Shows submitted timesheet from TC-14
- [ ] Employee ID displays
- [ ] Total hours show correctly
- [ ] Billable hours breakdown visible

#### TC-20: View Timesheet Details
- [ ] Click "View" button on a pending timesheet
- [ ] Modal opens with details
- [ ] Summary section shows (Total Hours, Billable, Entries)
- [ ] Entry table displays all entries
- [ ] Shows Date, Project, Task, Hours, Billable columns

#### TC-21: Approve Timesheet
- [ ] From modal or list, click "Approve"
- [ ] Confirm approval
- [ ] Verify success message
- [ ] Timesheet disappears from pending list
- [ ] Check backend: Project actuals should update

#### TC-22: Reject Timesheet
- [ ] Click "Reject" button
- [ ] Modal opens for rejection reason
- [ ] Enter reason: "Please add more task details"
- [ ] Click "Reject Timesheet"
- [ ] Verify success message
- [ ] Timesheet removed from pending list

#### TC-23: Days Waiting Indicator
- [ ] Check submission date
- [ ] If >3 days ago, should show in red
- [ ] Otherwise shows in gray

---

### 7. Rejected Timesheet Workflow

**Navigation**: Back to TimesheetEntry as employee

**Test Cases**:

#### TC-24: Handle Rejection
- [ ] Navigate to timesheet that was rejected
- [ ] Verify status shows "REJECTED"
- [ ] Check rejection reason displays in yellow box
- [ ] Form should be editable again
- [ ] Modify entries (add more details to task descriptions)
- [ ] Click "Submit for Approval" again
- [ ] Verify resubmission successful

---

### 8. Capacity Validation End-to-End

**Test Full Workflow**:

#### TC-25: Overallocation Prevention
1. [ ] Go to Project → Team tab
2. [ ] Note employee's current allocation (e.g., Employee X at 50%)
3. [ ] Check their availability (should show 50% available)
4. [ ] Try to add same employee to another project with 60%
5. [ ] System should prevent and show error
6. [ ] Reduce allocation to 40%
7. [ ] Should succeed
8. [ ] Check Capacity tab shows 90% total allocation

---

### 9. Cross-Component Integration

**Test Data Flow**:

#### TC-26: Timesheet to Project Actuals
1. [ ] Note project's current actual hours (Project Details → Overview)
2. [ ] Submit and approve timesheet with 40 hours
3. [ ] Check project details again
4. [ ] Verify actual hours increased by 40
5. [ ] Check budget variance updated
6. [ ] Verify cost calculations

#### TC-27: Team Member to Capacity
1. [ ] Add team member with 70% allocation
2. [ ] Immediately check Capacity tab
3. [ ] Verify new member appears in charts
4. [ ] Check role distribution pie chart updates
5. [ ] Verify team capacity cards reflect new member

---

## 🔍 Backend API Testing

### Manual API Tests (Using PowerShell)

```powershell
# 1. Login and get token
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"apitest@test.com","password":"Test@1234"}'
$token = ($loginResponse.Content | ConvertFrom-Json).token

# 2. Get project team members
Invoke-WebRequest -Uri "http://localhost:5000/api/projects/[PROJECT_ID]/members" `
  -Headers @{Authorization="Bearer $token"}

# 3. Get team capacity
Invoke-WebRequest -Uri "http://localhost:5000/api/projects/[PROJECT_ID]/members/capacity" `
  -Headers @{Authorization="Bearer $token"}

# 4. Get or create timesheet
Invoke-WebRequest -Uri "http://localhost:5000/api/timesheets/get-or-create?weekStartDate=2026-02-10" `
  -Headers @{Authorization="Bearer $token"}

# 5. Get pending approvals
Invoke-WebRequest -Uri "http://localhost:5000/api/timesheets/pending-approvals" `
  -Headers @{Authorization="Bearer $token"}
```

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: Can't See Projects
**Solution**: 
- Login with user that has projects assigned
- Or create a test project first
- Verify PROJECT_VIEW permission

### Issue 2: Can't Add Team Members
**Solution**:
- Check PROJECT_MANAGE_TEAM permission
- Verify employees exist in system
- Check employee status is ACTIVE

### Issue 3: Can't Access Timesheet Approvals
**Solution**:
- Need TIMESHEET_APPROVE permission
- Login as manager or admin
- Check role has correct permissions

### Issue 4: Charts Not Rendering
**Solution**:
- Verify recharts library installed: `cd frontend; npm ls recharts`
- If missing: `npm install recharts`
- Restart frontend server

### Issue 5: Backend Connection Errors
**Solution**:
- Check backend is running: http://localhost:5000/api/health
- Verify CORS settings in backend
- Check frontend API_URL in .env or config

---

## 📊 Performance Checks

### Load Time Expectations
- [ ] Project Details page: <2 seconds
- [ ] Team tab loads: <1 second
- [ ] Capacity charts render: <1 second
- [ ] Timesheet entry page: <2 seconds
- [ ] Approval dashboard: <2 seconds

### Data Accuracy
- [ ] Capacity calculations correct (sum = 100% per employee)
- [ ] Timesheet hours sum correctly
- [ ] Billable vs non-billable breakdown accurate
- [ ] Project actuals update after approval
- [ ] Chart data matches table data

---

## 🎯 Success Criteria

### Must Pass (Critical)
- ✅ All authentication works
- ✅ Team members can be added/edited/removed
- ✅ Timesheets can be created and submitted
- ✅ Approvals work correctly
- ✅ Capacity validation prevents >100%
- ✅ No console errors
- ✅ No API errors (check Network tab)

### Should Pass (Important)
- ✅ Charts render correctly
- ✅ Status badges show proper colors
- ✅ Navigation works smoothly
- ✅ Modals open/close properly
- ✅ Forms validate input
- ✅ Success/error messages display

### Nice to Have (Enhancement)
- ✅ Animations smooth
- ✅ Mobile responsive
- ✅ Fast load times
- ✅ Intuitive UX

---

## 📝 Test Results Form

**Date**: __________  
**Tester**: __________  
**Browser**: __________

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-1: View Team | ☐ Pass ☐ Fail | |
| TC-2: Add Member | ☐ Pass ☐ Fail | |
| TC-3: Check Availability | ☐ Pass ☐ Fail | |
| TC-4: Edit Member | ☐ Pass ☐ Fail | |
| TC-5: Remove Member | ☐ Pass ☐ Fail | |
| TC-6: View Capacity | ☐ Pass ☐ Fail | |
| TC-7: Utilization Status | ☐ Pass ☐ Fail | |
| TC-8: Capacity Warnings | ☐ Pass ☐ Fail | |
| TC-9: Create Timesheet | ☐ Pass ☐ Fail | |
| TC-10: Add Entries | ☐ Pass ☐ Fail | |
| TC-11: Multiple Entries | ☐ Pass ☐ Fail | |
| TC-12: Save Draft | ☐ Pass ☐ Fail | |
| TC-13: Remove Entry | ☐ Pass ☐ Fail | |
| TC-14: Submit Timesheet | ☐ Pass ☐ Fail | |
| TC-15: Empty Validation | ☐ Pass ☐ Fail | |
| TC-16: View History | ☐ Pass ☐ Fail | |
| TC-17: Filter Status | ☐ Pass ☐ Fail | |
| TC-18: View Details | ☐ Pass ☐ Fail | |
| TC-19: View Approvals | ☐ Pass ☐ Fail | |
| TC-20: View Details Modal | ☐ Pass ☐ Fail | |
| TC-21: Approve | ☐ Pass ☐ Fail | |
| TC-22: Reject | ☐ Pass ☐ Fail | |
| TC-23: Days Waiting | ☐ Pass ☐ Fail | |
| TC-24: Handle Rejection | ☐ Pass ☐ Fail | |
| TC-25: Overallocation | ☐ Pass ☐ Fail | |
| TC-26: Timesheet to Actuals | ☐ Pass ☐ Fail | |
| TC-27: Team to Capacity | ☐ Pass ☐ Fail | |

**Overall Result**: ☐ PASS ☐ FAIL  
**Issues Found**: ___________  
**Comments**: ___________

---

## 🛠️ Developer Tools

### Chrome DevTools Checks
```javascript
// Check for console errors
// Open DevTools → Console tab
// Should be no red errors

// Check Network tab
// All API calls should return 200
// No CORS errors

// Check React DevTools
// Component tree should render correctly
// Props should flow correctly
```

---

## 🚀 Next Steps After Testing

1. **If All Pass**:
   - Mark Week 2 as complete ✅
   - Move to Week 3 planning
   - Document any UX improvements
   - Plan additional features

2. **If Issues Found**:
   - Document bugs in detail
   - Prioritize fixes (Critical/High/Medium/Low)
   - Create fix branches
   - Retest after fixes

---

**Happy Testing!** 🎉

For questions or issues, refer to:
- [PROJECT_MANAGEMENT_UI_QUICK_REF.md](./PROJECT_MANAGEMENT_UI_QUICK_REF.md)
- [PROJECT_MANAGEMENT_WEEK2_PROGRESS.md](./PROJECT_MANAGEMENT_WEEK2_PROGRESS.md)
