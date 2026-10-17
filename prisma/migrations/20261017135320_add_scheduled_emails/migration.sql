-- CreateEnum
CREATE TYPE "EmailReportType" AS ENUM ('PENDING_ITEMS_DIGEST', 'EXPENSE_SUMMARY');

-- CreateEnum
CREATE TYPE "EmailScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'EVERY_N_DAYS', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('SENT', 'SKIPPED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PENDING_ITEMS_DIGEST';
ALTER TYPE "NotificationType" ADD VALUE 'EXPENSE_SUMMARY';

-- CreateTable
CREATE TABLE "ScheduledEmail" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" "EmailReportType" NOT NULL,
    "templateId" TEXT,
    "frequency" "EmailScheduleFrequency" NOT NULL,
    "intervalDays" INTEGER,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "sendTime" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "toEmails" TEXT[],
    "ccEmails" TEXT[],
    "includeOverdueTransactions" BOOLEAN NOT NULL DEFAULT true,
    "includeOverdueInstallments" BOOLEAN NOT NULL DEFAULT true,
    "includeOpenDebts" BOOLEAN NOT NULL DEFAULT false,
    "skipIfEmpty" BOOLEAN NOT NULL DEFAULT true,
    "summaryPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "nextRun" TIMESTAMP(3) NOT NULL,
    "lastRun" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledEmailLog" (
    "id" TEXT NOT NULL,
    "scheduledEmailId" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL,
    "recipients" TEXT[],
    "subject" TEXT NOT NULL DEFAULT '',
    "error" TEXT,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledEmail_isActive_nextRun_idx" ON "ScheduledEmail"("isActive", "nextRun");

-- CreateIndex
CREATE INDEX "ScheduledEmail_workspaceId_idx" ON "ScheduledEmail"("workspaceId");

-- CreateIndex
CREATE INDEX "ScheduledEmailLog_scheduledEmailId_sentAt_idx" ON "ScheduledEmailLog"("scheduledEmailId", "sentAt");

-- AddForeignKey
ALTER TABLE "ScheduledEmail" ADD CONSTRAINT "ScheduledEmail_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEmail" ADD CONSTRAINT "ScheduledEmail_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEmail" ADD CONSTRAINT "ScheduledEmail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEmailLog" ADD CONSTRAINT "ScheduledEmailLog_scheduledEmailId_fkey" FOREIGN KEY ("scheduledEmailId") REFERENCES "ScheduledEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
