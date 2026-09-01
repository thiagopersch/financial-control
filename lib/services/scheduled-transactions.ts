import prisma from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  isWeekend,
  startOfMonth,
} from 'date-fns';

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

function isBeforeCurrentMonth(date: Date, now: Date): boolean {
  return (
    date.getFullYear() < now.getFullYear() ||
    (date.getFullYear() === now.getFullYear() && date.getMonth() < now.getMonth())
  );
}

/**
 * Creates a PENDING transaction for every active ScheduledTransaction whose
 * nextRun is due, then advances nextRun according to its frequency.
 *
 * Occurrences from months that have already passed are never backfilled as
 * transactions - they are skipped so nextRun catches up to the current
 * month. A transaction is only created for the current occurrence if one
 * for this scheduled transaction doesn't already exist in that month.
 */
export async function processDueScheduledTransactions() {
  try {
    const due = await prisma.scheduledTransaction.findMany({
      where: { isActive: true, nextRun: { lte: new Date() } },
    });

    for (const scheduled of due) {
      try {
        const now = new Date();
        let nextRun = scheduled.nextRun;

        while (isBeforeCurrentMonth(nextRun, now)) {
          nextRun = computeNextRun(
            scheduled.frequency,
            nextRun,
            scheduled.dayOfMonth,
            scheduled.dayOfWeek,
            scheduled.customDays,
          );
        }

        if (nextRun > now) {
          await prisma.scheduledTransaction.update({
            where: { id: scheduled.id },
            data: { nextRun },
          });
          continue;
        }

        const alreadyExists = await prisma.transaction.findFirst({
          where: {
            scheduledTransactionId: scheduled.id,
            date: { gte: startOfMonth(nextRun), lte: endOfMonth(nextRun) },
          },
        });

        if (!alreadyExists) {
          await prisma.transaction.create({
            data: {
              type: scheduled.type,
              amount: scheduled.amount,
              date: nextRun,
              dueDate: nextRun,
              status: TransactionStatus.PENDING,
              description: scheduled.name,
              categoryId: scheduled.categoryId,
              accountId: scheduled.accountId,
              paymentMethodId: scheduled.paymentMethodId,
              creditCardId: scheduled.creditCardId,
              costCenterId: scheduled.costCenterId,
              workspaceId: scheduled.workspaceId,
              scheduledTransactionId: scheduled.id,
              notes: `Gerado automaticamente pelo agendamento "${scheduled.name}"`,
            },
          });
        }

        const followingRun = computeNextRun(
          scheduled.frequency,
          nextRun,
          scheduled.dayOfMonth,
          scheduled.dayOfWeek,
          scheduled.customDays,
        );

        await prisma.scheduledTransaction.update({
          where: { id: scheduled.id },
          data: { lastRun: new Date(), nextRun: followingRun },
        });

        if (!alreadyExists) {
          await notifyScheduledResult(
            scheduled.workspaceId,
            true,
            `Agendamento "${scheduled.name}" gerou uma transação de R$ ${Number(scheduled.amount).toFixed(2)} com sucesso.`,
          );
        }
      } catch (error) {
        console.error('Error processing scheduled transaction:', scheduled.id, error);
        await notifyScheduledResult(
          scheduled.workspaceId,
          false,
          `Falha ao executar o agendamento "${scheduled.name}": ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        );
      }
    }

    return { processed: due.length };
  } catch (error) {
    console.error('Error processing scheduled transactions:', error);
    return { processed: 0 };
  }
}

async function notifyScheduledResult(workspaceId: string, success: boolean, detail: string) {
  try {
    const user = await prisma.user.findFirst({ where: { workspaceId } });
    if (!user) return;

    const { notifyAutomationResult } = await import('@/lib/actions/notifications');
    await notifyAutomationResult({
      source: 'SCHEDULED_TRANSACTION',
      success,
      detail,
      userId: user.id,
      workspaceId,
    });
  } catch (error) {
    console.error('Error notifying scheduled transaction result:', error);
  }
}
