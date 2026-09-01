import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType } from '@prisma/client';

/**
 * Limite consumido reflete só a competência (mês) vigente — parcelas/dívidas
 * futuras não pagas não devem reduzir o limite disponível antes do seu mês.
 */
function getCompetenceRange(referenceDate: Date) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

function currentCompetenceWhere(creditCardIds: string[], referenceDate: Date) {
  const { start, end } = getCompetenceRange(referenceDate);
  return {
    creditCardId: { in: creditCardIds },
    type: TransactionType.EXPENSE,
    status: { not: TransactionStatus.PAID },
    OR: [{ dueDate: { gte: start, lte: end } }, { dueDate: null, date: { gte: start, lte: end } }],
  };
}

/** Soma do valor consumido do limite no mês vigente, por cartão. */
export async function getCreditCardsCurrentUsage(
  creditCardIds: string[],
  referenceDate: Date = new Date(),
): Promise<Record<string, number>> {
  if (creditCardIds.length === 0) return {};

  const transactions = await prisma.transaction.findMany({
    where: currentCompetenceWhere(creditCardIds, referenceDate),
    select: { creditCardId: true, amount: true },
  });

  const usage: Record<string, number> = {};
  for (const t of transactions) {
    if (!t.creditCardId) continue;
    usage[t.creditCardId] = (usage[t.creditCardId] || 0) + Number(t.amount);
  }
  return usage;
}

export async function getCreditCardCurrentUsage(
  creditCardId: string,
  referenceDate: Date = new Date(),
): Promise<number> {
  const usage = await getCreditCardsCurrentUsage([creditCardId], referenceDate);
  return usage[creditCardId] || 0;
}

export interface CreditCardUsageItem {
  id: string;
  description: string;
  debtName: string | null;
  amount: number;
  dueDate: string;
  status: TransactionStatus;
}

/** Itens (transações/parcelas de dívida) que consomem o limite no mês vigente. */
export async function getCreditCardUsageDetails(
  creditCardId: string,
  referenceDate: Date = new Date(),
): Promise<CreditCardUsageItem[]> {
  const transactions = await prisma.transaction.findMany({
    where: currentCompetenceWhere([creditCardId], referenceDate),
    include: { debt: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
  });

  return transactions.map((t) => ({
    id: t.id,
    description: t.description || t.debt?.name || 'Transação',
    debtName: t.debt?.name ?? null,
    amount: Number(t.amount),
    dueDate: (t.dueDate ?? t.date).toISOString(),
    status: t.status,
  }));
}
