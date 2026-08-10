-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
