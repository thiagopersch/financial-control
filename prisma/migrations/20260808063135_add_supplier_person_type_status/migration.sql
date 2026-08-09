-- CreateEnum
CREATE TYPE "SupplierPersonType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "personType" "SupplierPersonType" NOT NULL DEFAULT 'COMPANY';
