/*
  Warnings:

  - You are about to drop the column `approverRole` on the `WorkflowStep` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `WorkflowStep` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku,tenantId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,tenantId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permission` to the `WorkflowStep` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stepOrder` to the `WorkflowStep` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Item_sku_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "meta" JSONB,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WorkflowStep" DROP COLUMN "approverRole",
DROP COLUMN "order",
ADD COLUMN     "permission" TEXT NOT NULL,
ADD COLUMN     "stepOrder" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_tenantId_key" ON "Item"("sku", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_tenantId_key" ON "Role"("name", "tenantId");
