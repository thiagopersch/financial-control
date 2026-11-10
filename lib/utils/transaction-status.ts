import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
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

/** Papel do tema usado por cada situação (cor de fundo/friso da linha). */
const SITUATION_ROLE: Record<TransactionSituation, 'paid' | 'overdue' | 'pending' | 'dueSoon'> = {
  PAID: 'paid',
  OVERDUE: 'overdue',
  DUE_TODAY: 'dueSoon',
  DUE_TOMORROW: 'dueSoon',
  PENDING: 'pending',
};

/**
 * Estilo da linha da tabela por situação: fundo suave na cor do papel do tema,
 * mais escuro no hover, e um friso colorido à esquerda — via `sx`, não mais
 * Tailwind cru (a cor já responde ao claro/escuro pelo próprio tema).
 */
export function getTransactionRowSx(situation: TransactionSituation): SxProps<Theme> {
  const role = SITUATION_ROLE[situation];
  return (theme) => {
    const main = theme.palette[role].main;
    return {
      bgcolor: alpha(main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
      borderLeft: 3,
      borderColor: main,
      '&:hover': { bgcolor: alpha(main, theme.palette.mode === 'dark' ? 0.18 : 0.1) },
    };
  };
}

export const TRANSACTION_SITUATION_LEGEND: {
  label: string;
  role: 'paid' | 'pending' | 'overdue' | 'dueSoon';
}[] = [
  { label: 'Pago', role: 'paid' },
  { label: 'Pendente', role: 'pending' },
  { label: 'Vence hoje/amanhã', role: 'dueSoon' },
  { label: 'Atrasado', role: 'overdue' },
];
