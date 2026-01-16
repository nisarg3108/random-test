/*
  Warnings:

  - Added the required column `permission` to the `Approval` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Approval` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "data" JSONB,
ADD COLUMN     "permission" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;
