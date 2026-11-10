-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "externalApiTimeoutMs" INTEGER NOT NULL DEFAULT 10000;

-- CreateIndex
CREATE INDEX "AIConversation_workspaceId_userId_updatedAt_idx" ON "AIConversation"("workspaceId", "userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Account_workspaceId_idx" ON "Account"("workspaceId");

-- CreateIndex
CREATE INDEX "Budget_workspaceId_year_month_idx" ON "Budget"("workspaceId", "year", "month");

-- CreateIndex
CREATE INDEX "Category_workspaceId_idx" ON "Category"("workspaceId");

-- CreateIndex
CREATE INDEX "Debt_workspaceId_status_idx" ON "Debt"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Goal_workspaceId_isActive_idx" ON "Goal"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Notification_workspaceId_userId_type_createdAt_idx" ON "Notification"("workspaceId", "userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_isActive_nextRun_idx" ON "ScheduledTransaction"("isActive", "nextRun");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_workspaceId_idx" ON "ScheduledTransaction"("workspaceId");

-- CreateIndex
CREATE INDEX "Supplier_workspaceId_idx" ON "Supplier"("workspaceId");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_date_idx" ON "Transaction"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_status_dueDate_idx" ON "Transaction"("workspaceId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_categoryId_competence_idx" ON "Transaction"("workspaceId", "categoryId", "competence");

-- CreateIndex
CREATE INDEX "Transaction_creditCardId_status_dueDate_idx" ON "Transaction"("creditCardId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_debtId_idx" ON "Transaction"("debtId");

-- CreateIndex
CREATE INDEX "Transaction_scheduledTransactionId_competence_idx" ON "Transaction"("scheduledTransactionId", "competence");
