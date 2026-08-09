-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "supplierId" TEXT;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
