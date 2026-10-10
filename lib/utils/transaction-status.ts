import { addDays, isSameDay, startOfDay } from 'date-fns';

type SituationTransaction = {
  type: string;
  status: string;
  date: Date | string;
  dueDate: Date | string | null;
};

/**
 * Situação exibida na lista de transações (badge "Situação" e cor da linha).
 * - PAID: paga
 * - OVERDUE: status atrasado ou pendente com vencimento antes de hoje
 * - DUE_TODAY / DUE_TOMORROW: pendente vencendo hoje/amanhã
 * - PENDING: pendente em dia
 */
export type TransactionSituation = 'PAID' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_TOMORROW' | 'PENDING';

export function getTransactionSituation(
  transaction: SituationTransaction,
  now: Date = new Date(),
): TransactionSituation {
  if (transaction.status === 'PAID') return 'PAID';
  if (transaction.status === 'OVERDUE') return 'OVERDUE';

  const today = startOfDay(now);
  const due = startOfDay(new Date(transaction.dueDate || transaction.date));

  if (due < today) return 'OVERDUE';
  if (isSameDay(due, today)) return 'DUE_TODAY';
  if (isSameDay(due, addDays(today, 1))) return 'DUE_TOMORROW';
  return 'PENDING';
}

/** Situação que não depende do relógio — usada antes da hidratação para evitar mismatch. */
export function getStaticTransactionSituation(
  transaction: Pick<SituationTransaction, 'status'>,
): TransactionSituation {
  if (transaction.status === 'PAID') return 'PAID';
  if (transaction.status === 'OVERDUE') return 'OVERDUE';
  return 'PENDING';
}

/**
 * Classes da linha da tabela por situação: fundo suave, hover no mesmo matiz e
 * marcador à esquerda (inset shadow, para não deslocar o layout).
 */
export const TRANSACTION_ROW_CLASSES: Record<TransactionSituation, string> = {
  PAID: 'bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/25 dark:hover:bg-emerald-900/35 shadow-[inset_3px_0_0_0_var(--color-emerald-500)]',
  OVERDUE:
    'bg-red-50/70 hover:bg-red-100/80 dark:bg-red-950/25 dark:hover:bg-red-900/35 shadow-[inset_3px_0_0_0_var(--color-red-500)]',
  DUE_TODAY:
    'bg-orange-50/70 hover:bg-orange-100/80 dark:bg-orange-950/25 dark:hover:bg-orange-900/35 shadow-[inset_3px_0_0_0_var(--color-orange-500)]',
  DUE_TOMORROW:
    'bg-orange-50/70 hover:bg-orange-100/80 dark:bg-orange-950/25 dark:hover:bg-orange-900/35 shadow-[inset_3px_0_0_0_var(--color-orange-500)]',
  PENDING:
    'bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 shadow-[inset_3px_0_0_0_var(--color-amber-500)]',
};

export const TRANSACTION_SITUATION_LEGEND: { label: string; dotClassName: string }[] = [
  { label: 'Pago', dotClassName: 'bg-emerald-500' },
  { label: 'Pendente', dotClassName: 'bg-amber-500' },
  { label: 'Vence hoje/amanhã', dotClassName: 'bg-orange-500' },
  { label: 'Atrasado', dotClassName: 'bg-red-500' },
];
