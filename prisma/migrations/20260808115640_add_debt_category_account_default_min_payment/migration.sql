-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "categoryId" TEXT,
ALTER COLUMN "minimumPayment" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
