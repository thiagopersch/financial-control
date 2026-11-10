import prisma from '@/lib/prisma';
import type { Actor } from '@/lib/services/alerts';
import { toCompetence } from '@/lib/utils/competence';
import { moveDateToCurrentMonth } from '@/lib/utils/transaction-dates';
import { TransactionStatus } from '@prisma/client';
import { startOfDay, startOfMonth } from 'date-fns';

const UPDATE_CHUNK_SIZE = 10;

/**
 * Move para o mês atual o que venceu em mês anterior, ou o que já venceu mas
 * ainda está numa competência passada (ex.: competência 09, vencimento 05/10).
 * Roda na fila (antes rodava dentro do GET da lista de transações).
 */
export async function autoMoveOverdueTransactions(actor: Actor, now = new Date()) {
  const monthStart = startOfMonth(now);
  const currentCompetence = toCompetence(now);

  const candidates = await prisma.transaction.findMany({
    where: {
      workspaceId: actor.workspaceId,
      autoMoveEnabled: true,
      status: { in: [TransactionStatus.PENDING, TransactionStatus.OVERDUE] },
      OR: [
        { date: { lt: monthStart } },
        { competence: { lt: currentCompetence }, date: { lt: startOfDay(now) } },
      ],
    },
    select: { id: true, date: true, dueDate: true, competence: true, status: true },
  });
  if (candidates.length === 0) return { moved: 0 };

  const moves = candidates.map((t) => {
    const isPastMonth = t.date < monthStart;
    const newDate = isPastMonth ? moveDateToCurrentMonth(t.date, now) : t.date;
    return { t, newDate };
  });

  // Atualizações em paralelo (em blocos, para não esgotar o pool) — antes era
  // update + audit log sequenciais por linha.
  for (let i = 0; i < moves.length; i += UPDATE_CHUNK_SIZE) {
    await Promise.all(
      moves.slice(i, i + UPDATE_CHUNK_SIZE).map(({ t, newDate }) =>
        prisma.transaction.update({
          where: { id: t.id, workspaceId: actor.workspaceId },
          // `originalCompetence` não é alterada: guarda a competência de origem.
          data: {
            date: newDate,
            dueDate: newDate,
            competence: currentCompetence,
            status: TransactionStatus.OVERDUE,
          },
          select: { id: true },
        }),
      ),
    );
  }

  await prisma.auditLog.createMany({
    data: moves.map(({ t, newDate }) => ({
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      action: 'AUTO_MOVE_TO_CURRENT_MONTH',
      entity: 'Transaction',
      entityId: t.id,
      oldValue: { date: t.date, dueDate: t.dueDate, competence: t.competence, status: t.status },
      newValue: {
        date: newDate,
        dueDate: newDate,
        competence: currentCompetence,
        status: TransactionStatus.OVERDUE,
      },
      userAgent: 'system:queue',
    })),
  });

  return { moved: moves.length };
}
