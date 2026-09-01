-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('ACTIVE', 'PAID', 'CANCELLED', 'RENEGOTIATED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "status" "DebtStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill: former isActive=false meant the debt balance had been fully paid off
UPDATE "Debt" SET "status" = 'PAID' WHERE "isActive" = false;

-- AlterTable
ALTER TABLE "Debt" DROP COLUMN "isActive";
