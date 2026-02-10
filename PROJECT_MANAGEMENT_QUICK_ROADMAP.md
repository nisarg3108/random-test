# Project Management Enhancement - Quick Roadmap

**Total Effort:** 90 hours (18-22 business days)  
**Priority Focus:** HIGH items first (60 hours / 12 days)

---

## Week 1: Foundation Layer ⚡ HIGH PRIORITY

### Day 1-2: Database Schema (8.5h)
- [ ] **ProjectMember model** - Replace JSON teamMembers (2h)
  - Fields: employeeId, role, allocationPercent, dates, status
  - Migration script for existing data
- [ ] **ProjectTimesheet model** - Weekly grouping (2h)
  - Fields: weekDates, status, totals, approval tracking
- [ ] **Update Project model** - Add computed fields (1h)
  - totalActualHours, budgetVariance, healthScore
- [ ] **Update ProjectTimeLog** - Add timesheetId relation (0.5h)
- [ ] **Update ProjectResource** - Add capacity fields (1.5h)
- [ ] **Run migrations & verify** (1.5h)

### Day 3-4: Team & Timesheet APIs (8h)
- [ ] **project-member.service.js** (4h)
  - addProjectMember, listMembers, update, remove
  - checkMemberAvailability (validate allocation ≤ 100%)
- [ ] **timesheet.service.js** (4h)
  - createTimesheet, submit, approve, reject
  - getMyTimesheets, getPendingApprovals
  - Lock approved timesheets

### Day 5: Frontend - Project Form (4h)
- [ ] **ProjectFormModal enhancement**
  - Replace text PM with EmployeeSelector dropdown
  - Add TeamMemberPicker component (multi-select)
  - Add actualStartDate, actualEndDate fields
  - Add file upload for attachments

---

## Week 2: Core Enhancements ⚡ HIGH PRIORITY

### Day 6: Frontend - Time Tracking (5h)
- [ ] **TimesheetWeekView component** (3h)
  - 7-day grid layout
  - Add time log per day
  - Show totals (billable/non-billable)
- [ ] **TimeLogModal enhancement** (2h)
  - ProjectSelector dropdown
  - MilestoneSelector (filtered by project)
  - Billable checkbox + hourly rate input
  - Submit button

### Day 7: Frontend - Timesheet Approval (3h)
- [ ] **TimesheetApprovalList page**
  - List pending timesheets
  - Approve/Reject buttons
  - Rejection reason modal
  - Filters: employee, date range

### Day 8-9: Budget Integration (5h)
- [ ] **budget-rollup.service.js** (3h)
  - calculateProjectActualCost (budgets + time logs + resources)
  - calculateBudgetVariance
  - Auto-update Project.actualCost
- [ ] **Budget API enhancements** (2h)
  - POST /projects/:id/budget-summary
  - Add transaction date validation
  - Support attachments

### Day 10: Frontend - Budget UI (3h)
- [ ] **BudgetEntryModal enhancement**
  - Add transactionDate DatePicker
  - Add file upload for receipts
  - Show variance calculation (red/green)
- [ ] **BudgetSummaryCard component**
  - Chart: Planned vs Actual
  - Breakdown by category
  - Alert badges for overruns

---

## Week 3: Advanced Features (Medium Priority)

### Day 11-12: Milestone Dependencies (5h)
- [ ] **ProjectMilestoneDependency model** (2h)
  - predecessorId, successorId, type (FS/SS/FF/SF), lagDays
- [ ] **milestone-dependency.service.js** (3h)
  - createDependency, delete
  - detectCircularDependencies (graph validation)
  - calculateCriticalPath (CPM algorithm)

### Day 13: Frontend - Milestone Enhancement (5h)
- [ ] **MilestoneFormModal enhancement**
  - EmployeeSelector for assignedTo
  - Deliverables list (name, status, dueDate, files)
  - DependencyManager (add predecessor/successor)
- [ ] **CriticalPathVisualization** component
  - Highlight critical milestones in red
  - Show slack time

### Day 14: Resource Capacity (3h)
- [ ] **resource-capacity.service.js**
  - checkResourceAvailability
  - getEmployeeUtilization (compute allocated hours)
  - getOverallocatedResources
- [ ] **Frontend - CapacityWarning component**
  - Show alert when allocation > 100%
  - Display current utilization %

### Day 15: Analytics APIs (4h)
- [ ] **project-analytics.service.js**
  - getProjectPerformance (SPI, CPI)
  - calculateEarnedValue (EV = % complete × budget)
  - getProjectHealth (score based on budget, schedule, quality)
  - generateStatusReport

---

## Week 4: Integration & Polish

### Day 16: Validation & Business Rules (2h)
- [ ] **Zod schemas** for all endpoints
  - projectCreateSchema, milestoneSchema, resourceSchema, timeLogSchema
- [ ] **Business rules middleware**
  - Project end > start date
  - Milestone within project timeline
  - Resource allocation ≤ 100% per employee

### Day 17: Integrations (5h)
- [ ] **Finance integration** (3h)
  - Import expenses to budget
  - Sync actual cost with finance transactions
- [ ] **Notification service** (2h)
  - Timesheet submitted → notify manager
  - Budget threshold → alert PM
  - Milestone due soon → notify assignee

### Day 18: Frontend - Resource Enhancement (4h)
- [ ] **ResourceAllocationModal enhancement**
  - EmployeeSelector for HUMAN resources
  - Start/end date DateRangePicker
  - AllocationPercent slider with capacity check
  - Show current utilization chart

### Day 19: Frontend - Analytics Dashboard (5h)
- [ ] **ProjectPerformanceDashboard**
  - KPI cards: SPI, CPI, EAC, VAC
  - EarnedValueChart (PV, EV, AC over time)
  - Health score indicator (red/yellow/green)

### Day 20: Testing (6h)
- [ ] **Unit tests** (3h)
  - Service functions (capacity checks, variance calculations)
  - Validation schemas
  - Critical path algorithm
- [ ] **Integration tests** (2h)
  - API endpoints (CRUD operations)
  - Workflow: timesheet submit → approve
- [ ] **E2E test** (1h)
  - Full project lifecycle

---

## Optional Enhancements (Medium Priority - Future Sprints)

### Gantt Chart & Timeline (6h)
- [ ] **ProjectGanttChart component**
  - Use react-gantt-chart library
  - Show milestones as tasks
  - Dependency arrows
  - Critical path highlighting
  - Drag-to-reschedule

### Document Integration (2h)
- [ ] Link project to document folder
- [ ] Show documents tab in project details
- [ ] Upload/download project files

### Payroll Integration (2h)
- [ ] Export approved billable hours to payroll
- [ ] Generate payroll timesheets

### Invoicing Integration (2h)
- [ ] Generate invoice from billable time logs
- [ ] Link invoice to project

---

## Critical Path (Must-Have for Launch)

```
Schema Updates (Day 1-2)
    ↓
Team & Timesheet APIs (Day 3-4)
    ↓
Budget Rollup Service (Day 8-9)
    ↓
Frontend: Project Form, Time Tracking, Budget UI (Day 5-7, 10)
    ↓
Validation & Testing (Day 16, 20)
    ↓
LAUNCH ✅
```

---

## Daily Checklist Template

### Morning (Setup)
- [ ] Pull latest code
- [ ] Review task requirements
- [ ] Set up test environment

### Development
- [ ] Write code (refer to plan)
- [ ] Add inline comments
- [ ] Run unit tests locally
- [ ] Test API with Postman/Thunder

### Evening (Wrap-up)
- [ ] Commit code with clear message
- [ ] Update task status
- [ ] Document blockers
- [ ] Plan next day tasks

---

## Quick Reference: Files to Create/Modify

### Backend Files to CREATE
```
backend/src/modules/projects/
  ├── project-member.service.js        ⭐ NEW
  ├── project-member.controller.js     ⭐ NEW
  ├── project-member.routes.js         ⭐ NEW
  ├── timesheet.service.js             ⭐ NEW
  ├── timesheet.controller.js          ⭐ NEW
  ├── timesheet.routes.js              ⭐ NEW
  ├── milestone-dependency.service.js  ⭐ NEW
  ├── milestone-dependency.controller.js ⭐ NEW
  ├── resource-capacity.service.js     ⭐ NEW
  ├── budget-rollup.service.js         ⭐ NEW
  ├── project-analytics.service.js     ⭐ NEW
  └── validation/
      └── project.validation.js        ⭐ NEW
```

### Backend Files to MODIFY
```
backend/prisma/schema.prisma           ✏️ MODIFY (add models)
backend/src/modules/projects/
  ├── project.service.js               ✏️ MODIFY (add rollup logic)
  ├── project.controller.js            ✏️ MODIFY (add analytics endpoints)
  └── project.routes.js                ✏️ MODIFY (mount new routes)
```

### Frontend Files to CREATE
```
frontend/src/
  ├── components/projects/
  │   ├── TeamMemberPicker.jsx         ⭐ NEW
  │   ├── EmployeeSelector.jsx         ⭐ NEW
  │   ├── TimesheetWeekView.jsx        ⭐ NEW
  │   ├── TimesheetApprovalList.jsx    ⭐ NEW
  │   ├── CapacityWarning.jsx          ⭐ NEW
  │   ├── BudgetSummaryCard.jsx        ⭐ NEW
  │   ├── DependencyManager.jsx        ⭐ NEW
  │   ├── ProjectPerformanceDashboard.jsx ⭐ NEW
  │   └── GanttChartView.jsx           ⭐ NEW (Optional)
  └── api/
      ├── project-member.api.js        ⭐ NEW
      └── timesheet.api.js             ⭐ NEW
```

### Frontend Files to MODIFY
```
frontend/src/
  ├── pages/projects/
  │   ├── ProjectList.jsx              ✏️ MODIFY (enhance filters)
  │   └── ProjectDetails.jsx           ✏️ MODIFY (add tabs, enhance UI)
  └── api/
      └── project.api.js               ✏️ MODIFY (add new endpoints)
```

---

## Key Business Rules Checklist

- [ ] Employee allocation across all projects ≤ 100%
- [ ] Project end date > start date
- [ ] Milestone due date within project timeline
- [ ] Budget actual amount ≥ 0
- [ ] Time log hours per day ≤ 24
- [ ] Timesheet can only be edited if status = DRAFT
- [ ] No circular dependencies in milestones
- [ ] Resource end date ≥ start date
- [ ] Only project manager or admin can approve timesheets

---

## Testing Scenarios (Must Pass)

### Scenario 1: Project Creation
1. Create project with PM and 3 team members
2. Verify team members saved correctly
3. Check project appears in dashboard
4. Verify PM receives notification

### Scenario 2: Time Tracking Workflow
1. Employee logs 8 hours on Monday
2. Employee submits timesheet on Friday
3. Manager approves timesheet
4. Verify timesheet locked from editing
5. Verify project actual cost updated

### Scenario 3: Budget Variance
1. Create budget with planned = $10,000
2. Add 3 budget entries totaling $12,000
3. Verify variance = -$2,000 (over budget)
4. Verify alert triggered

### Scenario 4: Resource Capacity
1. Allocate employee 80% to Project A
2. Try to allocate same employee 50% to Project B
3. Verify warning: "130% allocated (30% over capacity)"
4. Suggest alternative resources

### Scenario 5: Milestone Dependencies
1. Create Milestone A (Feb 1 - Feb 15)
2. Create Milestone B (Feb 16 - Feb 28)
3. Add dependency: B depends on A (FS)
4. Update A end date to Feb 20
5. Verify B auto-rescheduled to start Feb 21

---

## Communication Plan

### Daily Standup (15 min)
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

### Weekly Review (1 hour)
- Demo completed features
- Review test results
- Adjust priorities if needed

### Sprint Retrospective (1 hour)
- What went well?
- What can be improved?
- Action items for next sprint

---

## Rollout Strategy

### Phase 1: Internal Beta (Week 5)
- Deploy to staging
- Selected power users test
- Collect feedback
- Fix critical bugs

### Phase 2: Staged Rollout (Week 6)
- 25% of users (Day 1-2)
- 50% of users (Day 3-4)
- 100% of users (Day 5)
- Monitor error rates

### Phase 3: Full Production (Week 7+)
- All users
- Enable all features
- Monitor adoption metrics
- Ongoing support

---

## Success Metrics (Track Weekly)

| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| Features Completed | 100% | | | | |
| Test Coverage | 85%+ | | | | |
| Bug Count | < 5 | | | | |
| API Response Time | < 500ms | | | | |
| User Adoption | 80%+ | | | | |

---

## Support Resources

### Documentation
- API Docs: `/docs/api/projects`
- User Guide: `/docs/user/project-management`
- Video Tutorials: `/training/projects`

### Help Channels
- Slack: #project-management-help
- Email: support@erp.com
- Helpdesk: ticket.erp.com

### Escalation Path
1. Team Lead → 2. Tech Lead → 3. Engineering Manager

---

**Document Owner:** Development Team  
**Last Updated:** February 10, 2026  
**Next Milestone:** Complete Week 1 by Feb 17, 2026
