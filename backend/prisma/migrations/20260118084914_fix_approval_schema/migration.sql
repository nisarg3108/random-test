-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "workflowStepId" TEXT;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "WorkflowRequest" ADD COLUMN     "requestedBy" TEXT,
ADD COLUMN     "workflowId" TEXT;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
