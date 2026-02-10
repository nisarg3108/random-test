/*
  Warnings:

  - A unique constraint covering the columns `[dealNumber]` on the table `Deal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_customerId_fkey";

-- AlterTable
ALTER TABLE "Communication" ADD COLUMN     "activityId" TEXT,
ADD COLUMN     "attachmentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "dealId" TEXT,
ADD COLUMN     "direction" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "emailCc" TEXT,
ADD COLUMN     "emailFrom" TEXT,
ADD COLUMN     "emailTo" TEXT,
ADD COLUMN     "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingAttendees" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "meetingLocation" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "anniversary" TIMESTAMP(3),
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "doNotCall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "lastContactDate" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "mobilePhone" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "preferredChannel" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "smsOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twitterHandle" TEXT,
ADD COLUMN     "workPhone" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "accountManager" TEXT,
ADD COLUMN     "annualRevenue" DOUBLE PRECISION,
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "currencyCode" TEXT DEFAULT 'USD',
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "firstContactDate" TIMESTAMP(3),
ADD COLUMN     "lastContactDate" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "preferredChannel" TEXT,
ADD COLUMN     "primaryEmail" TEXT,
ADD COLUMN     "primaryPhone" TEXT,
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'BUSINESS';

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "closedDate" TIMESTAMP(3),
ADD COLUMN     "competitors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currencyCode" TEXT DEFAULT 'USD',
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "dealNumber" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "firstContactDate" TIMESTAMP(3),
ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "lostToCompetitor" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "pipelineId" TEXT DEFAULT 'default',
ADD COLUMN     "probability" INTEGER DEFAULT 0,
ADD COLUMN     "products" JSONB,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "stageOrder" INTEGER DEFAULT 0,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tax" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "teamMembers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "total" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "wonReason" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "authority" TEXT,
ADD COLUMN     "budget" DOUBLE PRECISION,
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "conversionSource" TEXT,
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "dealId" TEXT,
ADD COLUMN     "disqualifiedAt" TIMESTAMP(3),
ADD COLUMN     "disqualifiedBy" TEXT,
ADD COLUMN     "disqualifiedReason" TEXT,
ADD COLUMN     "firstContactDate" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "lastContactDate" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "leadScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "medium" TEXT,
ADD COLUMN     "need" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'MEDIUM',
ADD COLUMN     "rating" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timeline" TEXT;

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "isClosedWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosedLost" BOOLEAN NOT NULL DEFAULT false,
    "daysInStage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "reminderAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "customerId" TEXT,
    "contactId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "customerId" TEXT,
    "dealId" TEXT,
    "communicationId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pipeline_tenantId_isDefault_idx" ON "Pipeline"("tenantId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_tenantId_name_key" ON "Pipeline"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PipelineStage_tenantId_pipelineId_idx" ON "PipelineStage"("tenantId", "pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_pipelineId_name_key" ON "PipelineStage"("pipelineId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_pipelineId_order_key" ON "PipelineStage"("pipelineId", "order");

-- CreateIndex
CREATE INDEX "Activity_tenantId_assignedTo_idx" ON "Activity"("tenantId", "assignedTo");

-- CreateIndex
CREATE INDEX "Activity_tenantId_status_idx" ON "Activity"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Activity_tenantId_dueDate_idx" ON "Activity"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "Activity_tenantId_customerId_idx" ON "Activity"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Activity_tenantId_dealId_idx" ON "Activity"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "CustomerNote_tenantId_customerId_idx" ON "CustomerNote"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_customerId_idx" ON "Attachment"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_dealId_idx" ON "Attachment"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "Tag_tenantId_category_idx" ON "Tag"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_tenantId_name_category_key" ON "Tag"("tenantId", "name", "category");

-- CreateIndex
CREATE INDEX "Communication_tenantId_customerId_idx" ON "Communication"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Communication_tenantId_contactId_idx" ON "Communication"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "Communication_tenantId_leadId_idx" ON "Communication"("tenantId", "leadId");

-- CreateIndex
CREATE INDEX "Communication_tenantId_dealId_idx" ON "Communication"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "Communication_tenantId_occurredAt_idx" ON "Communication"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "Contact_tenantId_customerId_idx" ON "Contact"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Contact_tenantId_email_idx" ON "Contact"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Contact_tenantId_ownerId_idx" ON "Contact"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Customer_tenantId_ownerId_idx" ON "Customer"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_category_idx" ON "Customer"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_dealNumber_key" ON "Deal"("dealNumber");

-- CreateIndex
CREATE INDEX "Deal_tenantId_customerId_idx" ON "Deal"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Deal_tenantId_stage_idx" ON "Deal"("tenantId", "stage");

-- CreateIndex
CREATE INDEX "Deal_tenantId_status_idx" ON "Deal"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Deal_tenantId_ownerId_idx" ON "Deal"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "Deal_tenantId_expectedCloseDate_idx" ON "Deal"("tenantId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Lead_tenantId_ownerId_idx" ON "Lead"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_leadScore_idx" ON "Lead"("tenantId", "leadScore");

-- CreateIndex
CREATE INDEX "Lead_tenantId_source_idx" ON "Lead"("tenantId", "source");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
