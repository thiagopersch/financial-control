import { addDays, isSameDay, startOfDay } from 'date-fns';

type SortableTransaction = {
  type: string;
  status: string;
  date: Date | string;
  dueDate: Date | string | null;
  amount: number | string | { toString(): string };
};

const TYPE_RANK: Record<string, number> = {
  EXPENSE: 0,
  INCOME: 1,
};

const STATUS_RANK: Record<string, number> = {
  OVERDUE: 0,
  PENDING: 1,
  PAID: 2,
};

function getTypeRank(type: string) {
  return TYPE_RANK[type] ?? 2;
}

function getStatusRank(status: string) {
  return STATUS_RANK[status] ?? 3;
}

/**
 * Mirrors the situação badge shown in the UI (Vencida -> Vence hoje -> Vence
 * amanhã -> Em dia), so the sort order matches what the user sees in the column.
 */
function getAtrasoRank(transaction: SortableTransaction) {
  if (transaction.type === 'INCOME') return 0;
  if (transaction.status === 'PAID') return 3;

  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(transaction.dueDate || transaction.date));

  if (dueDate < today) return 0; // Vencida
  if (isSameDay(dueDate, today)) return 1; // Vence hoje
  if (isSameDay(dueDate, addDays(today, 1))) return 2; // Vence amanhã
  return 3; // Em dia
}

function getDueTime(transaction: SortableTransaction) {
  return new Date(transaction.dueDate || transaction.date).getTime();
}

export function compareTransactionsDefault<T extends SortableTransaction>(a: T, b: T) {
  const typeDiff = getTypeRank(a.type) - getTypeRank(b.type);
  if (typeDiff !== 0) return typeDiff;

  const statusDiff = getStatusRank(a.status) - getStatusRank(b.status);
  if (statusDiff !== 0) return statusDiff;

  const atrasoDiff = getAtrasoRank(a) - getAtrasoRank(b);
  if (atrasoDiff !== 0) return atrasoDiff;

  const dueDiff = getDueTime(a) - getDueTime(b);
  if (dueDiff !== 0) return dueDiff;

  return Number(b.amount.toString()) - Number(a.amount.toString());
}
