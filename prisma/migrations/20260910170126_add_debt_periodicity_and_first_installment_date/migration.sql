-- CreateEnum
CREATE TYPE "Periodicity" AS ENUM ('UNIQUE', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "firstInstallmentDate" TIMESTAMP(3),
ADD COLUMN     "periodicity" "Periodicity";
