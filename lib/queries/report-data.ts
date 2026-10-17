import { DEBT_OPEN_STATUSES } from '@/lib/constants/debt-status';
import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType, type Prisma } from '@prisma/client';
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

/**
 * Data access for scheduled report e-mails. Takes an explicit `workspaceId`
 * (no session) because it runs from the cron route as well as from actions —
 * callers are responsible for authorizing the workspace.
 */

export interface OverdueItem {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  categoryName: string;
  debtName: string | null;
  installmentLabel: string | null;
}

/**
 * Same rule as getTransactionSituation (lib/utils/transaction-status.ts):
 * stored OVERDUE, or not PAID with (dueDate ?? date) before today.
 */
function overdueWhere(workspaceId: string, today: Date): Prisma.TransactionWhereInput {
  return {
    workspaceId,
    type: TransactionType.EXPENSE,
    status: { not: TransactionStatus.PAID },
    OR: [
      { status: TransactionStatus.OVERDUE },
      { dueDate: { lt: today } },
      { dueDate: null, date: { lt: today } },
    ],
  };
}

async function findOverdue(workspaceId: string, installments: boolean, now: Date) {
  const today = startOfDay(now);
  const rows = await prisma.transaction.findMany({
    where: {
      ...overdueWhere(workspaceId, today),
      debtId: installments ? { not: null } : null,
    },
    include: {
      category: { select: { name: true } },
      debt: { select: { name: true, installments: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { date: 'asc' }],
    take: 500,
  });

  // Installment number = position among the debt's installments ordered by due date.
  const debtIds = installments ? [...new Set(rows.map((r) => r.debtId!))] : [];
  const positions = new Map<string, number>();
  if (debtIds.length) {
    const all = await prisma.transaction.findMany({
      where: { workspaceId, debtId: { in: debtIds } },
      select: { id: true, debtId: true },
      orderBy: [{ debtId: 'asc' }, { dueDate: 'asc' }, { date: 'asc' }],
    });
    const counters = new Map<string, number>();
    for (const t of all) {
      const n = (counters.get(t.debtId!) ?? 0) + 1;
      counters.set(t.debtId!, n);
      positions.set(t.id, n);
    }
  }

  return rows.map<OverdueItem>((t) => {
    const due = t.dueDate ?? t.date;
    const position = positions.get(t.id);
    return {
      id: t.id,
      description: t.description || t.category.name,
      amount: Number(t.amount),
      dueDate: due,
      daysOverdue: Math.max(differenceInCalendarDays(today, startOfDay(due)), 0),
      categoryName: t.category.name,
      debtName: t.debt?.name ?? null,
      installmentLabel:
        position != null
          ? t.debt?.installments
            ? `${position}/${t.debt.installments}`
            : String(position)
          : null,
    };
  });
}

export function getOverdueTransactions(workspaceId: string, now = new Date()) {
  return findOverdue(workspaceId, false, now);
}

export function getOverdueInstallments(workspaceId: string, now = new Date()) {
  return findOverdue(workspaceId, true, now);
}

export interface OpenDebtItem {
  id: string;
  name: string;
  status: string;
  currentValue: number;
  initialValue: number;
  installments: number | null;
  paidInstallments: number;
  overdueInstallments: number;
}

export async function getOpenDebts(workspaceId: string, now = new Date()): Promise<OpenDebtItem[]> {
  const today = startOfDay(now);
  const debts = await prisma.debt.findMany({
    where: { workspaceId, status: { in: DEBT_OPEN_STATUSES } },
    include: { transactions: { select: { status: true, dueDate: true, date: true } } },
    orderBy: { currentValue: 'desc' },
  });

  return debts.map((d) => ({
    id: d.id,
    name: d.name,
    status: d.status,
    currentValue: Number(d.currentValue),
    initialValue: Number(d.initialValue),
    installments: d.installments,
    paidInstallments: d.transactions.filter((t) => t.status === TransactionStatus.PAID).length,
    overdueInstallments: d.transactions.filter(
      (t) =>
        t.status === TransactionStatus.OVERDUE ||
        (t.status !== TransactionStatus.PAID && startOfDay(t.dueDate ?? t.date) < today),
    ).length,
  }));
}

export interface ExpenseSummary {
  from: Date;
  to: Date;
  expenseTotal: number;
  incomeTotal: number;
  expenseCount: number;
  previousExpenseTotal: number;
  byCategory: { name: string; color: string; value: number }[];
  byDay: { date: Date; value: number }[];
  topExpenses: { description: string; date: Date; amount: number; categoryName: string }[];
}

/** Totals for the `days` days ending yesterday (inclusive), compared with the period before it. */
export async function getExpenseSummary(
  workspaceId: string,
  days: number,
  now = new Date(),
): Promise<ExpenseSummary> {
  const to = startOfDay(now);
  const from = addDays(to, -days);
  const previousFrom = addDays(from, -days);

  const [transactions, previous] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        workspaceId,
        type: { in: [TransactionType.EXPENSE, TransactionType.INCOME] },
        date: { gte: from, lt: to },
      },
      include: { category: { select: { name: true, color: true } } },
    }),
    prisma.transaction.aggregate({
      where: {
        workspaceId,
        type: TransactionType.EXPENSE,
        date: { gte: previousFrom, lt: from },
      },
      _sum: { amount: true },
    }),
  ]);

  const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE);
  const incomeTotal = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const categories = new Map<string, { name: string; color: string; value: number }>();
  const dayTotals = new Map<number, number>();
  for (const t of expenses) {
    const amount = Number(t.amount);
    const cat = categories.get(t.category.name) ?? {
      name: t.category.name,
      color: t.category.color,
      value: 0,
    };
    cat.value += amount;
    categories.set(t.category.name, cat);
    const day = startOfDay(t.date).getTime();
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + amount);
  }

  const byDay = Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    return { date, value: dayTotals.get(date.getTime()) ?? 0 };
  });

  return {
    from,
    to: addDays(to, -1),
    expenseTotal: expenses.reduce((acc, t) => acc + Number(t.amount), 0),
    incomeTotal,
    expenseCount: expenses.length,
    previousExpenseTotal: Number(previous._sum.amount ?? 0),
    byCategory: [...categories.values()].sort((a, b) => b.value - a.value),
    byDay,
    topExpenses: [...expenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map((t) => ({
        description: t.description || t.category.name,
        date: t.date,
        amount: Number(t.amount),
        categoryName: t.category.name,
      })),
  };
}
