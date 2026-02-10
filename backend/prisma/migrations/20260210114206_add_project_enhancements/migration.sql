-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budgetVariance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "documentFolderId" TEXT,
ADD COLUMN     "financeAccountId" TEXT,
ADD COLUMN     "healthScore" TEXT NOT NULL DEFAULT 'GREEN',
ADD COLUMN     "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN     "scheduleVariance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalActualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalPlannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalResourceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "utilizationPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProjectMilestone" ADD COLUMN     "isAutoScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCriticalPath" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProjectResource" ADD COLUMN     "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "availableHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "quantityUnit" TEXT NOT NULL DEFAULT 'unit',
ADD COLUMN     "quantityUsed" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProjectTimeLog" ADD COLUMN     "timesheetId" TEXT;

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "allocationPercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "hourlyRate" DOUBLE PRECISION,
    "permissions" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestoneDependency" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'FS',
    "lagDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestoneDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTimesheet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billableHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTimesheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_employeeId_idx" ON "ProjectMember"("employeeId");

-- CreateIndex
CREATE INDEX "ProjectMember_tenantId_idx" ON "ProjectMember"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectMember_status_idx" ON "ProjectMember"("status");

-- CreateIndex
CREATE INDEX "ProjectMilestoneDependency_tenantId_idx" ON "ProjectMilestoneDependency"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMilestoneDependency_predecessorId_successorId_key" ON "ProjectMilestoneDependency"("predecessorId", "successorId");

-- CreateIndex
CREATE INDEX "ProjectTimesheet_employeeId_idx" ON "ProjectTimesheet"("employeeId");

-- CreateIndex
CREATE INDEX "ProjectTimesheet_status_idx" ON "ProjectTimesheet"("status");

-- CreateIndex
CREATE INDEX "ProjectTimesheet_weekStartDate_idx" ON "ProjectTimesheet"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTimesheet_tenantId_employeeId_weekStartDate_key" ON "ProjectTimesheet"("tenantId", "employeeId", "weekStartDate");

-- CreateIndex
CREATE INDEX "Project_status_priority_idx" ON "Project"("status", "priority");

-- CreateIndex
CREATE INDEX "Project_projectManager_idx" ON "Project"("projectManager");

-- CreateIndex
CREATE INDEX "Project_departmentId_idx" ON "Project"("departmentId");

-- CreateIndex
CREATE INDEX "Project_healthScore_idx" ON "Project"("healthScore");

-- CreateIndex
CREATE INDEX "ProjectResource_resourceType_idx" ON "ProjectResource"("resourceType");

-- CreateIndex
CREATE INDEX "ProjectResource_employeeId_idx" ON "ProjectResource"("employeeId");

-- CreateIndex
CREATE INDEX "ProjectTimeLog_employeeId_idx" ON "ProjectTimeLog"("employeeId");

-- CreateIndex
CREATE INDEX "ProjectTimeLog_projectId_idx" ON "ProjectTimeLog"("projectId");

-- CreateIndex
CREATE INDEX "ProjectTimeLog_timesheetId_idx" ON "ProjectTimeLog"("timesheetId");

-- CreateIndex
CREATE INDEX "ProjectTimeLog_status_idx" ON "ProjectTimeLog"("status");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestoneDependency" ADD CONSTRAINT "ProjectMilestoneDependency_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "ProjectMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestoneDependency" ADD CONSTRAINT "ProjectMilestoneDependency_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "ProjectMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTimeLog" ADD CONSTRAINT "ProjectTimeLog_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "ProjectTimesheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
