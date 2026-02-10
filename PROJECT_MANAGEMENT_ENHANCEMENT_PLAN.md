# Project Management Module - Enhancement Implementation Plan

**Date:** February 10, 2026  
**Module:** Project Management  
**Objective:** Fill gaps, improve workflows, and integrate with other ERP modules

---

## Executive Summary

This plan addresses critical gaps in the existing Project Management module, including:
- Team member management (replacing JSON with proper relations)
- Milestone dependencies and critical path
- Resource capacity planning and utilization tracking
- Budget integration with finance/expenses
- Time approval workflows and timesheet management
- Analytics and reporting dashboards

**Total Estimated Effort:** 18-22 days (144-176 hours)

---

## Phase 1: Database Schema Enhancements

### 1.1 Project Team Members Model
**Priority:** HIGH | **Effort:** 2 hours

**Current State:**
- `Project.teamMembers` is JSON field with no validation or queries

**Enhancement:**
```prisma
model ProjectMember {
  id                String   @id @default(uuid())
  tenantId          String
  projectId         String
  employeeId        String
  userId            String?  // Link to user account
  
  role              String   // PROJECT_MANAGER, TEAM_LEAD, DEVELOPER, DESIGNER, etc.
  allocationPercent Float    @default(100)
  
  startDate         DateTime
  endDate           DateTime?
  status            String   @default("ACTIVE") // ACTIVE, INACTIVE, COMPLETED
  
  hourlyRate        Float?   // Override project rate
  permissions       Json?    // Specific project permissions
  
  notes             String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
  @@index([employeeId])
  @@index([tenantId])
}
```

**Migration Tasks:**
- Create model in schema
- Migrate existing `teamMembers` JSON to ProjectMember table
- Update Project model to include relation

---

### 1.2 Milestone Dependencies Model
**Priority:** MEDIUM | **Effort:** 2 hours

**Enhancement:**
```prisma
model ProjectMilestoneDependency {
  id              String   @id @default(uuid())
  tenantId        String
  
  predecessorId   String   // Milestone that must finish first
  successorId     String   // Milestone that depends on predecessor
  
  dependencyType  String   @default("FS") // FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)
  lagDays         Int      @default(0)    // Lag time in days (can be negative for lead)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  predecessor     ProjectMilestone @relation("PredecessorDependencies", fields: [predecessorId], references: [id], onDelete: Cascade)
  successor       ProjectMilestone @relation("SuccessorDependencies", fields: [successorId], references: [id], onDelete: Cascade)
  
  @@unique([predecessorId, successorId])
  @@index([tenantId])
}
```

**Update ProjectMilestone:**
```prisma
model ProjectMilestone {
  // ... existing fields ...
  
  isCriticalPath  Boolean  @default(false)
  isAutoScheduled Boolean  @default(false)
  
  // Relations
  predecessors    ProjectMilestoneDependency[] @relation("SuccessorDependencies")
  successors      ProjectMilestoneDependency[] @relation("PredecessorDependencies")
}
```

---

### 1.3 Timesheet Management Model
**Priority:** HIGH | **Effort:** 2 hours

**Enhancement:**
```prisma
model ProjectTimesheet {
  id              String   @id @default(uuid())
  tenantId        String
  employeeId      String
  
  weekStartDate   DateTime // Monday of the week
  weekEndDate     DateTime // Sunday of the week
  
  status          String   @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, REJECTED
  
  totalHours      Float    @default(0)
  billableHours   Float    @default(0)
  
  submittedAt     DateTime?
  submittedBy     String?
  
  approvedAt      DateTime?
  approvedBy      String?
  rejectedAt      DateTime?
  rejectedBy      String?
  
  rejectionReason String?
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  timeLogs        ProjectTimeLog[]
  
  @@unique([tenantId, employeeId, weekStartDate])
  @@index([employeeId])
  @@index([status])
}
```

**Update ProjectTimeLog:**
```prisma
model ProjectTimeLog {
  // ... existing fields ...
  
  timesheetId     String?
  
  // Relations
  timesheet       ProjectTimesheet? @relation(fields: [timesheetId], references: [id])
}
```

---

### 1.4 Project Computed Fields & Indexes
**Priority:** MEDIUM | **Effort:** 1 hour

**Update Project model:**
```prisma
model Project {
  // ... existing fields ...
  
  // Computed/Rollup fields
  totalPlannedHours   Float    @default(0)
  totalActualHours    Float    @default(0)
  totalResourceCost   Float    @default(0)
  budgetVariance      Float    @default(0)
  scheduleVariance    Int      @default(0) // Days ahead/behind
  
  // Capacity & Health
  utilizationPercent  Float    @default(0)
  healthScore         String   @default("GREEN") // GREEN, YELLOW, RED
  riskLevel           String   @default("LOW")   // LOW, MEDIUM, HIGH, CRITICAL
  
  // Integrations
  documentFolderId    String?  // Link to document management
  financeAccountId    String?  // Link to finance accounts
  
  // Relations
  members             ProjectMember[]
}
```

**Additional Indexes:**
```prisma
@@index([status, priority])
@@index([projectManager])
@@index([departmentId])
@@index([healthScore])
```

---

### 1.5 Resource Capacity Tracking
**Priority:** MEDIUM | **Effort:** 1.5 hours

**Update ProjectResource:**
```prisma
model ProjectResource {
  // ... existing fields ...
  
  plannedHours    Float    @default(0)
  actualHours     Float    @default(0)
  availableHours  Float    @default(0)
  
  // For equipment/material
  quantity        Float    @default(1)
  quantityUsed    Float    @default(0)
  quantityUnit    String   @default("unit") // unit, hours, kg, etc.
  
  @@index([resourceType])
  @@index([employeeId])
}
```

---

## Phase 2: Backend API Enhancements

### 2.1 Project Team Management APIs
**Priority:** HIGH | **Effort:** 4 hours

**New Endpoints:**
```javascript
// Team Member Management
POST   /api/projects/:projectId/members
GET    /api/projects/:projectId/members
GET    /api/projects/members/:memberId
PUT    /api/projects/members/:memberId
DELETE /api/projects/members/:memberId

// Check member availability
GET    /api/projects/members/availability/:employeeId?startDate=&endDate=
```

**Service Methods:**
```javascript
// project-member.service.js
export const addProjectMember = async (projectId, memberData, tenantId)
export const listProjectMembers = async (projectId, tenantId)
export const updateProjectMember = async (memberId, data, tenantId)
export const removeProjectMember = async (memberId, tenantId)
export const checkMemberAvailability = async (employeeId, startDate, endDate, tenantId)
export const getEmployeeProjects = async (employeeId, tenantId, filters)
```

**Key Logic:**
- Validate employee exists
- Check for allocation conflicts (total allocation across projects > 100%)
- Auto-compute available capacity
- Send notifications on assignment

---

### 2.2 Milestone Dependencies APIs
**Priority:** MEDIUM | **Effort:** 3 hours

**New Endpoints:**
```javascript
// Milestone Dependencies
POST   /api/projects/milestones/:milestoneId/dependencies
GET    /api/projects/milestones/:milestoneId/dependencies
DELETE /api/projects/milestones/dependencies/:dependencyId

// Critical Path & Scheduling
GET    /api/projects/:projectId/critical-path
POST   /api/projects/:projectId/reschedule
GET    /api/projects/:projectId/gantt-data
```

**Service Methods:**
```javascript
// milestone-dependency.service.js
export const createDependency = async (predecessorId, successorId, data, tenantId)
export const listDependencies = async (milestoneId, tenantId)
export const deleteDependency = async (dependencyId, tenantId)
export const calculateCriticalPath = async (projectId, tenantId)
export const autoScheduleMilestones = async (projectId, tenantId)
export const detectCircularDependencies = async (milestoneId, newPredecessorId)
```

**Key Logic:**
- Validate no circular dependencies
- Calculate critical path using CPM algorithm
- Auto-reschedule dependent milestones when predecessor changes
- Generate Gantt chart data

---

### 2.3 Timesheet Management APIs
**Priority:** HIGH | **Effort:** 4 hours

**New Endpoints:**
```javascript
// Timesheet Management
POST   /api/projects/timesheets
GET    /api/projects/timesheets
GET    /api/projects/timesheets/:id
PUT    /api/projects/timesheets/:id

// Workflow actions
POST   /api/projects/timesheets/:id/submit
POST   /api/projects/timesheets/:id/approve
POST   /api/projects/timesheets/:id/reject

// Reports
GET    /api/projects/timesheets/my-timesheets
GET    /api/projects/timesheets/pending-approvals
GET    /api/projects/timesheets/summary
```

**Service Methods:**
```javascript
// timesheet.service.js
export const createTimesheet = async (employeeId, weekStartDate, tenantId)
export const getOrCreateTimesheet = async (employeeId, weekStartDate, tenantId)
export const updateTimesheet = async (timesheetId, data, tenantId)
export const submitTimesheet = async (timesheetId, userId, tenantId)
export const approveTimesheet = async (timesheetId, approverId, tenantId)
export const rejectTimesheet = async (timesheetId, approverId, reason, tenantId)
export const getMyTimesheets = async (employeeId, tenantId, filters)
export const getPendingApprovals = async (managerId, tenantId)
export const calculateTimesheetTotals = async (timesheetId)
```

**Key Logic:**
- Auto-create weekly timesheets
- Lock approved timesheets from editing
- Notify manager on submission
- Update project actual cost and budget variance on approval
- Integration with payroll (if billable)

---

### 2.4 Budget Integration & Rollup APIs
**Priority:** HIGH | **Effort:** 3 hours

**New Endpoints:**
```javascript
// Budget Integration
POST   /api/projects/:projectId/budgets/import-expenses
GET    /api/projects/:projectId/budget-summary
POST   /api/projects/:projectId/budget-forecast

// Alerts & Thresholds
POST   /api/projects/:projectId/budget-alerts
GET    /api/projects/:projectId/budget-alerts
```

**Service Methods:**
```javascript
// budget-rollup.service.js
export const importExpensesFromFinance = async (projectId, filters, tenantId)
export const calculateProjectActualCost = async (projectId, tenantId)
export const calculateBudgetVariance = async (projectId, tenantId)
export const getBudgetSummary = async (projectId, tenantId)
export const forecastBudget = async (projectId, tenantId)
export const checkBudgetThresholds = async (projectId, tenantId)
export const sendBudgetAlerts = async (projectId, tenantId)
```

**Key Logic:**
- Query finance/expenses module and import transactions
- Rollup: budget entries + time log costs + resource costs
- Calculate EAC (Estimate at Completion) and ETC (Estimate to Complete)
- Alert when variance > threshold (e.g., 10%)
- Auto-update project `actualCost` after every budget/time change

---

### 2.5 Resource Capacity & Utilization APIs
**Priority:** MEDIUM | **Effort:** 3 hours

**New Endpoints:**
```javascript
// Capacity Planning
GET    /api/projects/resources/capacity-report
GET    /api/projects/resources/utilization/:employeeId
POST   /api/projects/resources/check-availability

// What-if Analysis
POST   /api/projects/resources/simulate-allocation
```

**Service Methods:**
```javascript
// resource-capacity.service.js
export const getResourceCapacity = async (tenantId, filters)
export const getEmployeeUtilization = async (employeeId, tenantId, startDate, endDate)
export const checkResourceAvailability = async (resourceData, tenantId)
export const calculateTeamUtilization = async (projectId, tenantId)
export const simulateAllocation = async (allocationData, tenantId)
export const getOverallocatedResources = async (tenantId)
```

**Key Logic:**
- Calculate available hours per employee (working hours - allocated hours)
- Show utilization % per employee/resource
- Flag over-allocation (>100%)
- Suggest alternative resources

---

### 2.6 Analytics & Reporting APIs
**Priority:** MEDIUM | **Effort:** 4 hours

**New Endpoints:**
```javascript
// Analytics
GET    /api/projects/analytics/overview
GET    /api/projects/analytics/portfolio
GET    /api/projects/analytics/:projectId/performance
GET    /api/projects/analytics/:projectId/earned-value

// Reports
GET    /api/projects/reports/status-report
GET    /api/projects/reports/resource-allocation
GET    /api/projects/reports/budget-variance
GET    /api/projects/reports/time-summary
```

**Service Methods:**
```javascript
// project-analytics.service.js
export const getProjectPortfolio = async (tenantId, filters)
export const getProjectPerformance = async (projectId, tenantId)
export const calculateEarnedValue = async (projectId, tenantId)
export const getProjectHealth = async (projectId, tenantId)
export const generateStatusReport = async (projectId, tenantId)
export const getResourceAllocationReport = async (tenantId, filters)
export const getBudgetVarianceReport = async (tenantId, filters)
export const getTimeSummaryReport = async (filters, tenantId)
```

**Key Metrics:**
- SPI (Schedule Performance Index) = EV / PV
- CPI (Cost Performance Index) = EV / AC
- EAC (Estimate at Completion)
- Project health score based on schedule, budget, quality
- Resource utilization trends
- Budget burn rate

---

### 2.7 Validation & Business Rules
**Priority:** HIGH | **Effort:** 2 hours

**Implement using Zod:**
```javascript
// validation/project.validation.js
export const projectCreateSchema = z.object({...})
export const milestoneCreateSchema = z.object({...})
export const resourceAllocationSchema = z.object({...})
export const timeLogSchema = z.object({...})
```

**Business Rules:**
- Project end date must be after start date
- Milestone due date must be within project timeline
- Resource allocation sum per employee ≤ 100%
- Budget actual amount cannot be negative
- Time log hours per day ≤ 24

---

## Phase 3: Frontend UI Enhancements

### 3.1 Project Creation & Edit Form Enhancement
**Priority:** HIGH | **Effort:** 4 hours

**Current Gaps:**
- Project manager is free text, not employee selector
- No team member assignment
- No attachments upload
- No actual dates fields
- No custom fields support

**Enhancements:**
```jsx
// Components to add/modify:

<ProjectFormModal>
  <EmployeeSelector name="projectManager" />
  <TeamMemberPicker 
    selectedMembers={teamMembers}
    onAdd={handleAddMember}
    onRemove={handleRemoveMember}
  />
  <DateFields 
    startDate, endDate, 
    actualStartDate, actualEndDate 
  />
  <FileUploadZone 
    multiple 
    acceptedTypes={['.pdf', '.docx', '.xlsx', 'image/*']}
    onUpload={handleAttachments}
  />
  <CustomFieldsBuilder 
    fields={customFields}
    onChange={handleCustomFields}
  />
  <DepartmentSelector />
  <DocumentFolderLinker />
</ProjectFormModal>
```

**Features:**
- Employee autocomplete with role/department info
- Team member allocation % slider per member
- Drag-drop attachments with preview
- Dynamic custom field creation (text, number, date, dropdown)
- Link to document folder for centralized file management

---

### 3.2 Milestone Management Enhancement
**Priority:** HIGH | **Effort:** 5 hours

**Current Gaps:**
- No assignee selector
- No deliverables management
- No dependencies
- No critical path visualization

**Enhancements:**
```jsx
// MilestoneModal enhancements:

<MilestoneFormModal>
  <EmployeeSelector 
    name="assignedTo" 
    label="Milestone Owner"
  />
  
  <DeliverablesManager>
    <DeliverableItem 
      name, description, dueDate, status, files
    />
  </DeliverablesManager>
  
  <DependencyManager 
    predecessors={milestone.predecessors}
    successors={milestone.successors}
    onAddDependency={handleAddDependency}
    onRemoveDependency={handleRemoveDependency}
  >
    <MilestoneSelector />
    <DependencyTypeSelector /> {/* FS, SS, FF, SF */}
    <LagDaysInput />
  </DependencyManager>
  
  <ProgressTracker 
    current={milestone.progressPercent}
    onUpdate={handleProgressUpdate}
  />
</MilestoneFormModal>

// New visualizations:

<GanttChartView 
  milestones={project.milestones}
  dependencies={dependencies}
  criticalPath={criticalPath}
  onMilestoneClick={handleMilestoneClick}
  onDateChange={handleReschedule}
/>

<CriticalPathVisualization 
  milestones={criticalPathMilestones}
  totalDuration={projectDuration}
  slack={slack}
/>
```

**Features:**
- Gantt chart with drag-to-reschedule
- Critical path highlighted in red
- Dependency arrows with lag indicators
- Deliverables checklist with file attachments
- Auto-schedule based on dependencies

---

### 3.3 Resource Allocation Enhancement
**Priority:** HIGH | **Effort:** 4 hours

**Current Gaps:**
- No employee selector for human resources
- No start/end date fields
- No capacity warnings
- No utilization tracking

**Enhancements:**
```jsx
<ResourceAllocationModal>
  <ResourceTypeSelector 
    type={resourceType}
    onChange={handleTypeChange}
  />
  
  {resourceType === 'HUMAN' && (
    <>
      <EmployeeSelector 
        employeeId={employeeId}
        onChange={handleEmployeeChange}
      />
      <CapacityWarning 
        employee={selectedEmployee}
        allocation={allocationPercent}
        startDate={startDate}
        endDate={endDate}
      >
        {isOverallocated && (
          <Alert severity="warning">
            This employee is {utilizationPercent}% utilized. 
            Adding {allocationPercent}% will exceed 100%.
          </Alert>
        )}
      </CapacityWarning>
      <AllocationSlider 
        value={allocationPercent}
        max={availableCapacity}
        onChange={handleAllocationChange}
      />
    </>
  )}
  
  <DateRangeSelector 
    startDate={startDate}
    endDate={endDate}
    projectStartDate={project.startDate}
    projectEndDate={project.endDate}
  />
  
  <CostInputs 
    costPerUnit={costPerUnit}
    units={units}
    totalCost={totalCost}
  />
</ResourceAllocationModal>

// New resource views:

<ResourceUtilizationChart 
  resources={project.resources}
  type="timeline" // or "bar", "pie"
/>

<TeamCapacityMatrix 
  members={teamMembers}
  allocations={allocations}
  showAvailability
/>
```

**Features:**
- Employee picker with current utilization
- Visual capacity warnings (red/yellow/green)
- Alternative resource suggestions when overallocated
- Timeline view showing resource allocation across projects
- Hourly rate override per resource

---

### 3.4 Budget Management Enhancement
**Priority:** HIGH | **Effort:** 3 hours

**Current Gaps:**
- No transaction date field
- No attachments (receipts, invoices)
- No integration with finance/expenses
- No variance alerts

**Enhancements:**
```jsx
<BudgetEntryModal>
  <CategorySelector 
    category={category}
    customCategories={project.customBudgetCategories}
  />
  
  <DateField 
    name="transactionDate"
    label="Transaction Date"
    required
  />
  
  <AmountInputs>
    <CurrencyInput 
      name="plannedAmount"
      label="Planned Amount"
    />
    <CurrencyInput 
      name="actualAmount"
      label="Actual Amount"
    />
    <VarianceDisplay 
      variance={variance}
      percentage={variancePercent}
    />
  </AmountInputs>
  
  <FileUploadZone 
    label="Attach Receipts/Invoices"
    files={attachments}
    onUpload={handleAttachments}
  />
  
  <ExpenseLinkage>
    <Button onClick={() => setShowExpenseImport(true)}>
      Import from Finance/Expenses
    </Button>
  </ExpenseLinkage>
</BudgetEntryModal>

// Budget dashboard:

<BudgetSummaryCard>
  <BudgetVsActualChart 
    planned={totalPlanned}
    actual={totalActual}
    variance={variance}
  />
  
  <BudgetBreakdown 
    byCategory={budgetByCategory}
    byPeriod={budgetByPeriod}
  />
  
  <BudgetAlerts>
    {alerts.map(alert => (
      <AlertItem 
        type={alert.type}
        message={alert.message}
        threshold={alert.threshold}
      />
    ))}
  </BudgetAlerts>
  
  <BudgetForecast 
    eac={estimateAtCompletion}
    etc={estimateToComplete}
    burnRate={burnRate}
  />
</BudgetSummaryCard>
```

**Features:**
- Expense import from finance module
- Receipt/invoice attachments with preview
- Budget vs actual charts (bar, line, pie)
- Forecast based on burn rate
- Threshold alerts (email/notification)

---

### 3.5 Time Tracking & Timesheet Enhancement
**Priority:** HIGH | **Effort:** 5 hours

**Current Gaps:**
- No employee selector
- No milestone selector
- No approval workflow UI
- No timesheet grouping

**Enhancements:**
```jsx
// Weekly Timesheet View:

<TimesheetWeekView 
  weekStartDate={weekStart}
  weekEndDate={weekEnd}
  employeeId={currentUser.employeeId}
>
  <TimesheetHeader 
    status={timesheet.status}
    totalHours={timesheet.totalHours}
    onSubmit={handleSubmit}
  />
  
  <TimesheetGrid>
    {daysOfWeek.map(day => (
      <TimesheetDay date={day}>
        {timeLogs.filter(log => log.logDate === day).map(log => (
          <TimeLogRow 
            log={log}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        <AddTimeLogButton onClick={() => handleAddLog(day)} />
      </TimesheetDay>
    ))}
  </TimesheetGrid>
  
  <TimesheetFooter>
    <TotalHoursDisplay 
      total={totalHours}
      billable={billableHours}
      nonBillable={nonBillableHours}
    />
    {timesheet.status === 'DRAFT' && (
      <Button onClick={handleSubmitTimesheet}>
        Submit for Approval
      </Button>
    )}
  </TimesheetFooter>
</TimesheetWeekView>

// Time Log Modal:

<TimeLogModal>
  <ProjectSelector 
    projectId={projectId}
    onChange={handleProjectChange}
  />
  
  <MilestoneSelector 
    projectId={projectId}
    milestoneId={milestoneId}
    optional
  />
  
  <DateField 
    name="logDate"
    defaultValue={selectedDate}
  />
  
  <HoursInput 
    hours={hoursWorked}
    max={24}
    step={0.5}
  />
  
  <TaskDescriptionField 
    description={taskDescription}
    required
    rows={3}
  />
  
  <BillableCheckbox 
    billable={billable}
    onToggle={handleToggleBillable}
  />
  
  <HourlyRateInput 
    rate={hourlyRate}
    defaultRate={employee.defaultHourlyRate}
  />
</TimeLogModal>

// Approval Workflow:

<TimesheetApprovalList>
  <FilterBar 
    status, employee, project, dateRange
  />
  
  {pendingTimesheets.map(ts => (
    <TimesheetCard 
      timesheet={ts}
      employee={ts.employee}
      totalHours={ts.totalHours}
      projects={ts.projects}
    >
      <TimesheetDetailsModal 
        timesheet={ts}
        timeLogs={ts.timeLogs}
      />
      <ApprovalActions>
        <Button 
          variant="success"
          onClick={() => handleApprove(ts.id)}
        >
          Approve
        </Button>
        <Button 
          variant="danger"
          onClick={() => setRejectModal(ts.id)}
        >
          Reject
        </Button>
      </ApprovalActions>
    </TimesheetCard>
  ))}
</TimesheetApprovalList>
```

**Features:**
- Weekly timesheet grid (7-day view)
- Project + milestone selectors with autocomplete
- Submit for approval workflow
- Manager approval dashboard
- Lock approved timesheets from editing
- Integration with payroll for billable hours
- Time log templates (repeat common tasks)

---

### 3.6 Project Analytics & Dashboards
**Priority:** MEDIUM | **Effort:** 5 hours

**New Components:**

```jsx
// Portfolio Dashboard:

<ProjectPortfolioDashboard>
  <KPICards>
    <KPI label="Active Projects" value={stats.activeProjects} />
    <KPI label="Total Budget" value={stats.totalBudget} />
    <KPI label="Avg Health Score" value={stats.avgHealthScore} />
    <KPI label="Resource Utilization" value={stats.utilization} />
  </KPICards>
  
  <ProjectHealthMatrix 
    projects={projects}
    xAxis="budget-variance"
    yAxis="schedule-variance"
    colorBy="health-score"
  />
  
  <PortfolioCharts>
    <ProjectsByStatus />
    <BudgetVsActualByProject />
    <ResourceUtilizationTrend />
    <MilestoneCompletionRate />
  </PortfolioCharts>
</ProjectPortfolioDashboard>

// Project Performance Dashboard:

<ProjectPerformanceDashboard projectId={projectId}>
  <PerformanceMetrics>
    <MetricCard 
      title="Schedule Performance"
      value={spi}
      status={spi >= 1 ? 'good' : 'warning'}
      description="SPI = EV / PV"
    />
    <MetricCard 
      title="Cost Performance"
      value={cpi}
      status={cpi >= 1 ? 'good' : 'warning'}
      description="CPI = EV / AC"
    />
    <MetricCard 
      title="Estimate at Completion"
      value={eac}
      originalBudget={estimatedBudget}
    />
    <MetricCard 
      title="Variance at Completion"
      value={vac}
      percentage={vacPercent}
    />
  </PerformanceMetrics>
  
  <EarnedValueChart 
    pv={plannedValue}
    ev={earnedValue}
    ac={actualCost}
    timeline={timeline}
  />
  
  <BurndownChart 
    planned={plannedWork}
    actual={actualWork}
    remaining={remainingWork}
  />
  
  <RiskIndicators>
    <RiskItem 
      type="budget"
      severity={budgetRisk}
      message="Budget overrun risk: 15%"
    />
    <RiskItem 
      type="schedule"
      severity={scheduleRisk}
      message="Project delayed by 3 days"
    />
  </RiskIndicators>
</ProjectPerformanceDashboard>
```

**Features:**
- Real-time KPI updates
- Earned Value Management (EVM) charts
- Burndown/burnup charts
- Health score heatmap (red/yellow/green)
- Risk indicators and alerts
- Export reports to PDF/Excel

---

### 3.7 Gantt Chart & Timeline Views
**Priority:** MEDIUM | **Effort:** 6 hours

**Implementation:**
```jsx
// Using react-gantt-chart or similar library

<ProjectGanttChart 
  project={project}
  milestones={milestones}
  dependencies={dependencies}
  resources={resources}
  criticalPath={criticalPath}
>
  <GanttToolbar>
    <ViewModeSelector mode={viewMode} /> {/* Day, Week, Month */}
    <ZoomControls />
    <FilterControls />
    <ExportButton />
  </GanttToolbar>
  
  <GanttTimeline 
    startDate={project.startDate}
    endDate={project.endDate}
    today={new Date()}
  />
  
  <GanttTaskList>
    {milestones.map(milestone => (
      <GanttTask 
        task={milestone}
        dependencies={milestone.dependencies}
        isCritical={milestone.isCriticalPath}
        onDragEnd={handleReschedule}
        onClick={handleTaskClick}
      />
    ))}
  </GanttTaskList>
  
  <DependencyArrows 
    dependencies={dependencies}
    onArrowClick={handleDependencyClick}
  />
</ProjectGanttChart>

// Resource Timeline:

<ResourceTimelineView 
  resources={teamMembers}
  allocations={allocations}
  projects={projects}
>
  <ResourceRow resource={resource}>
    <AllocationBars 
      allocations={resource.allocations}
      capacity={resource.capacity}
      showOverallocation
    />
  </ResourceRow>
</ResourceTimelineView>
```

**Features:**
- Interactive Gantt with drag-to-reschedule
- Critical path highlighting
- Dependency visualization
- Resource timeline with capacity bars
- Milestone hover details
- Baseline vs actual comparison

---

## Phase 4: Integration & Workflows

### 4.1 Document Management Integration
**Priority:** MEDIUM | **Effort:** 2 hours

**Implementation:**
- Create document folder on project creation
- Link folder to `Project.documentFolderId`
- Show documents tab in project details
- Upload/download project files
- Version control for deliverables

**Endpoints:**
```javascript
POST /api/projects/:projectId/documents
GET  /api/projects/:projectId/documents
```

---

### 4.2 Finance/Expense Integration
**Priority:** HIGH | **Effort:** 3 hours

**Implementation:**
- Import expenses from finance module to budget
- Link budget categories to GL accounts
- Auto-create journal entries for project expenses
- Sync actual cost with finance transactions

**Endpoints:**
```javascript
POST /api/projects/:projectId/sync-expenses
GET  /api/projects/:projectId/finance-summary
```

---

### 4.3 Payroll Integration (Billable Hours)
**Priority:** MEDIUM | **Effort:** 2 hours

**Implementation:**
- Export approved billable time logs to payroll
- Calculate employee earnings based on hourly rates
- Link to payroll periods
- Generate timesheets for payroll processing

**Endpoints:**
```javascript
POST /api/projects/export-to-payroll
GET  /api/projects/payroll-export/:periodId
```

---

### 4.4 Invoicing Integration (Client Billing)
**Priority:** MEDIUM | **Effort:** 2 hours

**Implementation:**
- Generate invoice from billable time logs
- Include project/milestone details in invoice line items
- Link invoice to project for tracking
- Auto-update project revenue

**Endpoints:**
```javascript
POST /api/projects/:projectId/generate-invoice
GET  /api/projects/:projectId/invoices
```

---

### 4.5 Notification System
**Priority:** MEDIUM | **Effort:** 2 hours

**Notifications:**
- Project assignment (email + in-app)
- Milestone approaching due date (3 days, 1 day)
- Budget threshold exceeded (alert PM)
- Timesheet submitted (notify manager)
- Timesheet approved/rejected (notify employee)
- Resource overallocation (alert PM)
- Project health score change (alert stakeholders)

---

### 4.6 Approval Workflows
**Priority:** HIGH | **Effort:** 3 hours

**Workflows:**
1. **Timesheet Approval**
   - Employee submits → Manager receives notification
   - Manager reviews → Approves/Rejects
   - If approved: Update project costs, lock timesheet
   - If rejected: Employee revises and resubmits

2. **Budget Approval**
   - PM requests budget → Finance reviews
   - Approved: Budget active
   - Rejected: PM revises

3. **Project Closure**
   - PM marks complete → Stakeholder reviews
   - Close milestones, timesheets, budgets
   - Generate final report

---

## Phase 5: Testing & Documentation

### 5.1 Unit Tests
**Priority:** HIGH | **Effort:** 4 hours

**Coverage:**
- Service functions (85%+ coverage)
- Business logic (capacity checks, variance calculations)
- Validation schemas
- Critical path algorithm

---

### 5.2 Integration Tests
**Priority:** HIGH | **Effort:** 3 hours

**Coverage:**
- API endpoints (CRUD operations)
- Workflow sequences (timesheet submit → approve)
- Module integrations (finance, payroll, documents)

---

### 5.3 E2E Tests
**Priority:** MEDIUM | **Effort:** 3 hours

**Scenarios:**
- Create project → Add milestones → Allocate resources → Log time → Approve
- Budget tracking → Import expenses → Check variance → Alert
- Resource capacity → Check availability → Allocate → Overallocation warning

---

### 5.4 Documentation
**Priority:** HIGH | **Effort:** 3 hours

**Documents:**
- API documentation (Swagger/OpenAPI)
- User guide (project creation, timesheet submission)
- Admin guide (approval workflows, reports)
- Developer guide (architecture, data model)

---

## Effort Summary by Phase

| Phase | Component | Effort (hours) | Priority |
|-------|-----------|---------------|----------|
| **Phase 1: Schema** | | | |
| 1.1 | Project Members Model | 2 | HIGH |
| 1.2 | Milestone Dependencies | 2 | MEDIUM |
| 1.3 | Timesheet Management | 2 | HIGH |
| 1.4 | Computed Fields | 1 | MEDIUM |
| 1.5 | Resource Capacity | 1.5 | MEDIUM |
| **Phase 2: Backend** | | | |
| 2.1 | Team Management APIs | 4 | HIGH |
| 2.2 | Milestone Dependencies APIs | 3 | MEDIUM |
| 2.3 | Timesheet APIs | 4 | HIGH |
| 2.4 | Budget Integration APIs | 3 | HIGH |
| 2.5 | Resource Capacity APIs | 3 | MEDIUM |
| 2.6 | Analytics APIs | 4 | MEDIUM |
| 2.7 | Validation & Rules | 2 | HIGH |
| **Phase 3: Frontend** | | | |
| 3.1 | Project Form Enhancement | 4 | HIGH |
| 3.2 | Milestone Enhancement | 5 | HIGH |
| 3.3 | Resource Enhancement | 4 | HIGH |
| 3.4 | Budget Enhancement | 3 | HIGH |
| 3.5 | Time Tracking Enhancement | 5 | HIGH |
| 3.6 | Analytics Dashboards | 5 | MEDIUM |
| 3.7 | Gantt & Timeline Views | 6 | MEDIUM |
| **Phase 4: Integration** | | | |
| 4.1 | Document Management | 2 | MEDIUM |
| 4.2 | Finance Integration | 3 | HIGH |
| 4.3 | Payroll Integration | 2 | MEDIUM |
| 4.4 | Invoicing Integration | 2 | MEDIUM |
| 4.5 | Notifications | 2 | MEDIUM |
| 4.6 | Approval Workflows | 3 | HIGH |
| **Phase 5: Testing** | | | |
| 5.1 | Unit Tests | 4 | HIGH |
| 5.2 | Integration Tests | 3 | HIGH |
| 5.3 | E2E Tests | 3 | MEDIUM |
| 5.4 | Documentation | 3 | HIGH |
| **TOTAL** | | **90 hours** | |

---

## Implementation Sequence (Recommended)

### Sprint 1 (Week 1) - Foundation [20 hours]
**Priority: HIGH Items Only**
1. Schema: ProjectMember, Timesheet models (4h)
2. Backend: Team Management APIs (4h)
3. Backend: Timesheet APIs (4h)
4. Frontend: Project Form Enhancement (4h)
5. Frontend: Time Tracking Enhancement (4h)

### Sprint 2 (Week 2) - Core Features [20 hours]
1. Schema: Computed fields & indexes (1h)
2. Backend: Budget Integration & Rollup (3h)
3. Backend: Validation & Rules (2h)
4. Frontend: Milestone Enhancement (5h)
5. Frontend: Resource Enhancement (4h)
6. Frontend: Budget Enhancement (3h)
7. Integration: Finance Integration (2h)

### Sprint 3 (Week 3) - Advanced Features [20 hours]
1. Schema: Milestone Dependencies (2h)
2. Backend: Milestone Dependencies APIs (3h)
3. Backend: Resource Capacity APIs (3h)
4. Backend: Analytics APIs (4h)
5. Integration: Approval Workflows (3h)
6. Integration: Notifications (2h)
7. Testing: Unit Tests (3h)

### Sprint 4 (Week 4) - Polish & Launch [20 hours]
1. Schema: Resource Capacity (1.5h)
2. Frontend: Analytics Dashboards (5h)
3. Frontend: Gantt & Timeline (6h)
4. Integration: Document/Payroll/Invoicing (6h)
5. Testing: Integration & E2E (6h)
6. Documentation (3h)

### Optional Sprint 5 - Medium Priority Items [10 hours]
1. Advanced analytics & forecasting
2. AI-powered insights
3. Mobile responsiveness optimization
4. Advanced reporting templates

---

## Technical Dependencies

### Libraries to Add

**Backend:**
```json
{
  "zod": "^3.22.4",
  "date-fns": "^3.0.0",
  "graphlib": "^2.1.8"  // For critical path calculation
}
```

**Frontend:**
```json
{
  "react-gantt-chart": "^0.3.0",
  "recharts": "^2.10.0",  // For charts
  "react-select": "^5.8.0",  // For advanced selectors
  "react-dnd": "^16.0.1",  // For drag-drop
  "react-hook-form": "^7.49.0",  // For complex forms
  "date-fns": "^3.0.0"
}
```

---

## Risk Mitigation

### High Risks
1. **Critical Path Algorithm Complexity**
   - Mitigation: Use proven graph algorithms, add comprehensive tests
   
2. **Performance with Large Datasets**
   - Mitigation: Add pagination, indexes, caching, lazy loading
   
3. **Integration Breakage**
   - Mitigation: Versioned APIs, backward compatibility, feature flags

### Medium Risks
1. **User Adoption of New Features**
   - Mitigation: Progressive rollout, training, documentation
   
2. **Data Migration Issues**
   - Mitigation: Backup before migration, test on staging, rollback plan

---

## Success Metrics

### Functional Metrics
- [ ] All CRUD operations working for new models
- [ ] Timesheet approval workflow end-to-end
- [ ] Critical path calculation accurate
- [ ] Resource capacity warnings functional
- [ ] Budget variance updates in real-time

### Performance Metrics
- [ ] API response time < 500ms (95th percentile)
- [ ] Dashboard load time < 2s
- [ ] Gantt chart renders 100+ milestones smoothly

### Quality Metrics
- [ ] 85%+ code coverage
- [ ] Zero critical security vulnerabilities
- [ ] Accessibility score 90+ (WCAG AA)

---

## Maintenance Plan

### Post-Launch
- Monitor error rates and performance
- Collect user feedback (surveys, interviews)
- Weekly bug triage and fixes
- Monthly feature enhancements
- Quarterly security audits

### Future Enhancements (Backlog)
- AI-powered project risk prediction
- Predictive resource allocation
- Automated milestone rescheduling
- Voice-controlled time logging
- Mobile app for time tracking
- Integrations with Jira, Asana, etc.
- Machine learning for budget forecasting

---

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Project Manager | | | |
| QA Lead | | | |

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026  
**Next Review:** March 10, 2026
