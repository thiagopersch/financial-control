import prisma from '@/lib/prisma';
import { toCompetence } from '@/lib/utils/competence';
import { computeScheduledDueDate } from '@/lib/utils/scheduled-dates';
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

function isBeforeCurrentMonth(date: Date, now: Date): boolean {
  return (
    date.getFullYear() < now.getFullYear() ||
    (date.getFullYear() === now.getFullYear() && date.getMonth() < now.getMonth())
  );
}

type ScheduledTransactionRecord = Awaited<
  ReturnType<typeof prisma.scheduledTransaction.findMany>
>[number];

export type RunScheduledResult =
  | { status: 'created'; transactionId: string; occurrence: Date }
  | { status: 'skipped'; reason: 'not_due' | 'already_exists'; occurrence: Date };

/**
 * Executa um agendamento:
 * - Ocorrências de meses que já passaram nunca são geradas retroativamente: o
 *   `nextRun` é avançado até o mês atual.
 * - Sem `force`, só gera se a ocorrência já venceu (`nextRun <= agora`).
 * - Com `force` (execução manual), gera a próxima ocorrência mesmo que seja futura.
 * - Nunca gera duas transações do mesmo agendamento na mesma competência.
 */
export async function runScheduledTransaction(
  scheduled: ScheduledTransactionRecord,
  { force = false }: { force?: boolean } = {},
): Promise<RunScheduledResult> {
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

  if (!force && nextRun > now) {
    if (nextRun.getTime() !== scheduled.nextRun.getTime()) {
      await prisma.scheduledTransaction.update({
        where: { id: scheduled.id },
        data: { nextRun },
      });
    }
    return { status: 'skipped', reason: 'not_due', occurrence: nextRun };
  }

  const competence = toCompetence(nextRun);

  const alreadyExists = await prisma.transaction.findFirst({
    where: {
      scheduledTransactionId: scheduled.id,
      competence,
    },
    select: { id: true },
  });

  // Execução manual não altera o agendamento quando a ocorrência já foi gerada.
  if (alreadyExists && force) {
    return { status: 'skipped', reason: 'already_exists', occurrence: nextRun };
  }

  const created = alreadyExists
    ? null
    : await prisma.transaction.create({
        data: {
          type: scheduled.type,
          amount: scheduled.amount,
          date: nextRun,
          dueDate: computeScheduledDueDate(nextRun, scheduled.dueDay),
          competence,
          originalCompetence: competence,
          status: TransactionStatus.PENDING,
          description: scheduled.name,
          categoryId: scheduled.categoryId,
          accountId: scheduled.accountId,
          paymentMethodId: scheduled.paymentMethodId,
          creditCardId: scheduled.creditCardId,
          costCenterId: scheduled.costCenterId,
          supplierId: scheduled.supplierId,
          workspaceId: scheduled.workspaceId,
          scheduledTransactionId: scheduled.id,
          notes: `Gerado ${force ? 'manualmente' : 'automaticamente'} pelo agendamento "${scheduled.name}"`,
        },
        select: { id: true },
      });

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

  if (!created) {
    return { status: 'skipped', reason: 'already_exists', occurrence: nextRun };
  }

  await notifyScheduledResult(
    scheduled.workspaceId,
    true,
    `Agendamento "${scheduled.name}" gerou uma transação de R$ ${Number(scheduled.amount).toFixed(2)} com sucesso.`,
  );

  return { status: 'created', transactionId: created.id, occurrence: nextRun };
}

/**
 * Cria uma transação PENDING para todo ScheduledTransaction ativo cujo nextRun
 * já venceu e avança o nextRun conforme a frequência (ver runScheduledTransaction).
 */
export async function processDueScheduledTransactions() {
  try {
    const due = await prisma.scheduledTransaction.findMany({
      where: { isActive: true, nextRun: { lte: new Date() } },
    });

    for (const scheduled of due) {
      try {
        await runScheduledTransaction(scheduled);
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
