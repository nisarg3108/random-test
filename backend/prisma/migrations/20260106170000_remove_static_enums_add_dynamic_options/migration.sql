-- Remove static enums and add SystemOption table
-- CreateTable
CREATE TABLE "SystemOption" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "tenantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemOption_category_key_tenantId_key" ON "SystemOption"("category", "key", "tenantId");

-- AlterTable - Change enum columns to text (remove defaults first)
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE TEXT;
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "CompanyConfig" ALTER COLUMN "industry" TYPE TEXT;
ALTER TABLE "CompanyConfig" ALTER COLUMN "companySize" TYPE TEXT;

-- Drop the enums (with CASCADE to handle dependencies)
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "IndustryType" CASCADE;
DROP TYPE IF EXISTS "CompanySize" CASCADE;