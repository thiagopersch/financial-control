-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('TOTAL_DIVIDED', 'FIXED_INSTALLMENT');

-- CreateEnum
CREATE TYPE "FirstInstallmentMonth" AS ENUM ('CURRENT', 'NEXT');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "calculationType" "CalculationType",
ADD COLUMN     "firstInstallmentMonth" "FirstInstallmentMonth",
ADD COLUMN     "installmentValue" DECIMAL(12,2);
