-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('CONTINUOUS', 'INSTALLMENTS');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "installments" INTEGER,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentTransactionId" TEXT,
ADD COLUMN     "recurrenceType" "RecurrenceType";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_parentTransactionId_fkey" FOREIGN KEY ("parentTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
