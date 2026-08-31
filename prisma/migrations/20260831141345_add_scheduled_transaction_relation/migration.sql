-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "scheduledTransactionId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_scheduledTransactionId_fkey" FOREIGN KEY ("scheduledTransactionId") REFERENCES "ScheduledTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
