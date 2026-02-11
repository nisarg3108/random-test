-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "totalExpectedUnits" INTEGER,
ADD COLUMN     "unitsProducedToDate" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "AssetDepreciation" ADD COLUMN     "unitsProduced" INTEGER;
