-- DropIndex
DROP INDEX "CreditCard_accountId_key";

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "creditCardId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "isCreditCard" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "creditCardId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "ScheduledTransaction" ADD COLUMN     "creditCardId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "creditCardId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "creditCardId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT;

-- CreateIndex
CREATE INDEX "CreditCard_accountId_idx" ON "CreditCard"("accountId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
