-- AlterTable
ALTER TABLE "ExpenseClaim" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ExpenseClaim" ADD COLUMN "receiptUrl" TEXT;
ALTER TABLE "ExpenseClaim" ALTER COLUMN "description" DROP NOT NULL;

-- Update existing records to have a default title
UPDATE "ExpenseClaim" SET "title" = 'Expense Claim' WHERE "title" = '';

-- Remove the default constraint after updating existing records
ALTER TABLE "ExpenseClaim" ALTER COLUMN "title" DROP DEFAULT;