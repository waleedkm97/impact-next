-- AlterEnum
ALTER TYPE "StaffRole" ADD VALUE 'employee';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expectedTrainees" INTEGER;

-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "permissions" JSONB;

-- AlterTable
ALTER TABLE "TrainingGroup" ADD COLUMN     "expectedTrainees" INTEGER,
ADD COLUMN     "meetingLink" TEXT;
