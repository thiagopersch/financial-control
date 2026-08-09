import prisma from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';
import { addDays, addMonths, addWeeks, addYears, isWeekend } from 'date-fns';

function computeNextRun(
  frequency: string,
  from: Date,
  dayOfMonth: number | null,
  dayOfWeek: number | null,
  customDays: number[],
): Date {
  switch (frequency) {
    case 'DAILY':
      return addDays(from, 1);
    case 'WEEKLY':
      return addWeeks(from, 1);
    case 'MONTHLY': {
      const next = addMonths(from, 1);
      if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28));
      return next;
    }
    case 'YEARLY':
      return addYears(from, 1);
    case 'BUSINESS_DAYS': {
      let next = addDays(from, 1);
      while (isWeekend(next)) next = addDays(next, 1);
      return next;
    }
    case 'CUSTOM': {
      if (customDays.length === 0) return addDays(from, 1);
      const sorted = [...customDays].sort((a, b) => a - b);
      let next = addDays(from, 1);
      for (let i = 0; i < 366; i++) {
        if (sorted.includes(next.getDate())) return next;
        next = addDays(next, 1);
      }
      return addDays(from, 1);
    }
    default:
      return addMonths(from, 1);
  }
}

/**
 * Creates a PENDING transaction for every active ScheduledTransaction whose
 * nextRun is due, then advances nextRun according to its frequency.
 */
export async function processDueScheduledTransactions() {
  try {
    const due = await prisma.scheduledTransaction.findMany({
      where: { isActive: true, nextRun: { lte: new Date() } },
    });

    for (const scheduled of due) {
      await prisma.transaction.create({
        data: {
          type: scheduled.type,
          amount: scheduled.amount,
          date: scheduled.nextRun,
          dueDate: scheduled.nextRun,
          status: TransactionStatus.PENDING,
          description: scheduled.name,
          categoryId: scheduled.categoryId,
          accountId: scheduled.accountId,
          costCenterId: scheduled.costCenterId,
          workspaceId: scheduled.workspaceId,
          notes: `Gerado automaticamente pelo agendamento "${scheduled.name}"`,
        },
      });

      const nextRun = computeNextRun(
        scheduled.frequency,
        scheduled.nextRun,
        scheduled.dayOfMonth,
        scheduled.dayOfWeek,
        scheduled.customDays,
      );

      await prisma.scheduledTransaction.update({
        where: { id: scheduled.id },
        data: { lastRun: new Date(), nextRun },
      });
    }

    return { processed: due.length };
  } catch (error) {
    console.error('Error processing scheduled transactions:', error);
    return { processed: 0 };
  }
}
