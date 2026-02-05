-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "workflowRequestId" TEXT;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_workflowRequestId_fkey" FOREIGN KEY ("workflowRequestId") REFERENCES "WorkflowRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
