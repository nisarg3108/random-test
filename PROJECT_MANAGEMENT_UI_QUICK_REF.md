# Project Management UI Quick Reference

**Quick guide for using the new Project Management frontend components**

---

## 🚀 Quick Start

### Access Points

1. **Project Team Management**
   - Navigate to: Projects → [Select Project] → **Team** tab
   - URL: `/projects/{projectId}` → Tab: "Team"

2. **Team Capacity View**
   - Navigate to: Projects → [Select Project] → **Capacity** tab
   - URL: `/projects/{projectId}` → Tab: "Capacity"

3. **Timesheet Entry**
   - Direct URL: `/projects/timesheet/entry`
   - Or navigate via menu (add to navigation menu)

4. **My Timesheets**
   - Direct URL: `/projects/timesheet/my`
   - Or navigate via menu

5. **Timesheet Approvals** (Managers)
   - Direct URL: `/projects/timesheet/approvals`
   - Or navigate via menu

---

## 👥 Team Management (ProjectTeamTab)

### Add Team Member
1. Click "Add Member" button
2. Fill form:
   - **Employee** ⭐ (dropdown with active employees)
   - **Role** ⭐ (text, e.g., "Backend Developer")
   - **Allocation %** ⭐ (slider 0-100%)
   - **Start Date** ⭐ (date picker)
   - **End Date** (optional)
   - **Responsibilities** (textarea)
3. Click "Add Member"
   - System checks employee availability
   - Shows error if employee overallocated
   - Success message on completion

### Edit Team Member
1. Click edit icon (pencil) next to member
2. Modify fields (Employee ID locked)
3. Click "Update Member"

### Remove Team Member
1. Click delete icon (trash) next to member
2. Confirm removal
3. Member removed from project

### View Capacity Metrics
- **Total Members**: Count of all assigned members
- **Total Allocation**: Sum of all allocation percentages
- **Active Members**: Count of ACTIVE status members
- **Avg Allocation**: Average allocation per member

---

## ⏱️ Timesheet Entry (TimesheetEntry)

### Create/Edit Timesheet
1. Page loads current week (Monday-Sunday)
2. Use "Previous Week" / "Next Week" buttons to navigate
3. Current timesheet auto-created if doesn't exist

### Add Time Entry
1. Fill form:
   - **Project** ⭐ (dropdown, only IN_PROGRESS projects)
   - **Milestone** (optional, loads after selecting project)
   - **Date** ⭐ (dropdown, dates within current week)
   - **Hours** ⭐ (number, 0-24)
   - **Task Description** ⭐ (text)
   - **Billable** checkbox (default checked)
2. Click "Add Entry"
3. Entry appears in table below

### Remove Entry
- Click trash icon next to any entry
- Entry removed (only in DRAFT/REJECTED status)

### Save Draft
- Click "Save Draft" button
- Timesheet saved, remains editable
- Can continue adding entries later

### Submit for Approval
1. Click "Submit for Approval" button
2. Confirm submission
3. Timesheet status → SUBMITTED
4. Locked from editing
5. Manager notified

### Handle Rejection
- If timesheet rejected, see rejection reason at top
- Status changes to REJECTED
- Can edit entries again
- Resubmit after corrections

### View Summary
Bottom cards show:
- **Total Hours**: Sum of all entries
- **Billable Hours**: Sum of billable entries
- **Non-Billable Hours**: Difference

---

## 📋 My Timesheets (MyTimesheets)

### View Timesheet History
- Table shows all your timesheets
- Sorted by week (newest first)

### Filter by Status
Click status buttons at top:
- **ALL** - Show all timesheets
- **DRAFT** - Only drafts
- **SUBMITTED** - Awaiting approval
- **APPROVED** - Approved timesheets
- **REJECTED** - Rejected timesheets

### View Details
1. Click "View" button next to timesheet
2. Navigates to TimesheetEntry page
3. Loads selected week

### Summary Dashboard
Top cards show:
- **Total Timesheets**: Count of all timesheets
- **Approved**: Count of approved timesheets
- **Pending**: Count of submitted (awaiting approval)
- **Total Hours**: Sum of all hours logged

---

## ✅ Timesheet Approvals (TimesheetApprovals)

### View Pending Approvals
- Table shows all SUBMITTED timesheets
- Grouped by employee

### Quick View
Each row shows:
- Employee ID and name
- Week date range
- Total hours (billable breakdown)
- Submission date
- Days waiting (highlighted if >3 days)

### View Details
1. Click "View" button
2. Modal opens showing:
   - Week summary
   - All time entries in table
   - Project names
   - Task descriptions
   - Hours breakdown
3. Can approve/reject from modal

### Approve Timesheet
1. Click "Approve" button (from list or modal)
2. Confirm approval
3. System:
   - Changes status → APPROVED
   - Locks timesheet
   - Updates project actuals
   - Rolls up costs
   - Logs audit entry

### Reject Timesheet
1. Click "Reject" button
2. Modal opens
3. Enter rejection reason ⭐
4. Click "Reject Timesheet"
5. System:
   - Changes status → REJECTED
   - Stores rejection reason
   - Sends to employee
   - Employee can edit and resubmit

---

## 📊 Team Capacity Dashboard (TeamCapacityDashboard)

### Overview Cards
Top row shows:
- **Team Members**: Total count and active count
- **Total Allocation**: Sum across all members
- **Avg Allocation**: Average per member
- **Overallocated**: Count of employees >100%

### Allocation Bar Chart
- X-axis: Employee IDs
- Y-axis: Percentage (0-100%)
- Blue bars: Project allocation
- Green bars: Available capacity
- Compare allocation vs availability

### Role Distribution Pie Chart
- Shows allocation breakdown by role
- Percentages displayed on slices
- Legend with role counts

### Detailed Member Table
Shows for each member:
- Employee ID
- Role
- **Project Allocation**: This project only (with bar)
- **Total Allocation**: Across all projects (with colored bar)
- **Available**: Remaining capacity
- **Status**: Utilization badge

### Utilization Status
- 🟢 **Underutilized** (<50%): Green
- 🔵 **Optimal** (50-80%): Blue
- 🟡 **High** (80-100%): Yellow
- 🔴 **Overallocated** (>100%): Red

### Capacity Warnings
- Amber alert box at bottom
- Lists all overallocated employees
- Shows current allocation percentage
- Provides recommendation

---

## 🎨 UI Elements Guide

### Status Badges

**Timesheet Status**:
- 🟦 **DRAFT** - Gray badge, editable
- 🟦 **SUBMITTED** - Blue badge, awaiting approval
- 🟩 **APPROVED** - Green badge, locked
- 🟥 **REJECTED** - Red badge, editable with reason

**Team Member Status**:
- 🟩 **ACTIVE** - Green badge
- 🟦 **INACTIVE** - Gray badge
- 🟦 **COMPLETED** - Blue badge

### Color Coding

**Allocation Bars**:
- 🟩 Green: <50% (underutilized)
- 🟦 Blue: 50-80% (optimal)
- 🟨 Yellow: 80-100% (high)
- 🟥 Red: >100% (overallocated)

**Days Waiting**:
- Gray: 0-3 days
- Red: >3 days (overdue)

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close Modal | `Esc` |
| Submit Form | `Enter` (in single-line inputs) |
| Navigate Tabs | `Tab` |

---

## 🔔 Notifications

### Success Messages (Green)
- "Team member added successfully!"
- "Team member updated successfully!"
- "Timesheet saved successfully!"
- "Timesheet submitted successfully!"
- "Timesheet approved successfully!"

### Error Messages (Red)
- "Employee only has X% capacity available"
- "Cannot submit an empty timesheet"
- "Failed to load [resource]"
- "Failed to [action] [resource]"

### Warning Messages (Amber)
- Overallocation warnings in Capacity Dashboard
- Days waiting >3 days in Approvals

---

## 📱 Mobile Usage

All components are mobile-responsive:
- Tables scroll horizontally
- Grids stack vertically
- Modals adjust height
- Tabs scroll horizontally
- Forms stack single-column

---

## 🔒 Permissions Required

### Team Management
- View: `PROJECT_VIEW`
- Add/Edit/Remove: `PROJECT_MANAGE_TEAM`

### Timesheet Entry
- View/Create: `TIMESHEET_VIEW`, `TIMESHEET_CREATE`

### Timesheet Approvals
- Access: `TIMESHEET_APPROVE`

---

## 🆘 Common Issues

### Can't add team member
- ✅ Check employee has available capacity
- ✅ Verify allocation % is ≤100%
- ✅ Ensure required fields filled

### Can't submit timesheet
- ✅ Must have at least one entry
- ✅ Status must be DRAFT or REJECTED
- ✅ All entries must have valid hours (0-24)

### Can't see pending approvals
- ✅ Check you have TIMESHEET_APPROVE permission
- ✅ Verify employees have submitted timesheets

### Capacity shows red
- ✅ Employee allocated >100% across all projects
- ✅ Review other project allocations
- ✅ Consider reducing allocation or reassigning

---

## 🔄 Workflow Summary

### Team Member Lifecycle
```
Add Member → Check Availability → Assign → Track Capacity → Remove/Complete
```

### Timesheet Lifecycle
```
Create → Add Entries → Save Draft → Submit → Manager Reviews →
   ↓                                                 ↓
Approved (Locked) ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↓
                                                     ↓
Rejected → View Reason → Edit → Resubmit → → → → → ↑
```

---

## 📞 Support

For issues or questions:
1. Check error messages for specific guidance
2. Verify permissions with system administrator
3. Review backend logs for API errors
4. Check browser console for frontend errors

---

## 🎯 Best Practices

### Team Management
- ✅ Keep allocations ≤80% for flexibility
- ✅ Set end dates for temporary assignments
- ✅ Add clear responsibilities for each role
- ✅ Monitor capacity dashboard regularly

### Timesheet Entry
- ✅ Log hours daily (don't wait until end of week)
- ✅ Write clear task descriptions
- ✅ Mark billable hours correctly
- ✅ Submit by end of week (Friday)

### Timesheet Approval
- ✅ Review timesheets within 2-3 days
- ✅ Provide clear rejection reasons
- ✅ Check for unusual hour patterns
- ✅ Verify billable hour accuracy

### Capacity Planning
- ✅ Review capacity before new assignments
- ✅ Address overallocations immediately
- ✅ Balance workload across team
- ✅ Plan for time off and holidays

---

**Last Updated**: February 10, 2026  
**Version**: 1.0  
**Module**: Project Management - Week 2 Frontend
