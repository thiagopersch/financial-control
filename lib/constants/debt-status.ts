import { DebtStatus } from '@prisma/client';

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  ACTIVE: 'Ativa',
  PAID: 'Quitada',
  CANCELLED: 'Cancelada',
  RENEGOTIATED: 'Renegociada',
  SUSPENDED: 'Suspensa',
};

export const DEBT_STATUS_BADGE_VARIANT: Record<
  DebtStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ACTIVE: 'default',
  PAID: 'secondary',
  CANCELLED: 'destructive',
  RENEGOTIATED: 'outline',
  SUSPENDED: 'outline',
};

export const DEBT_STATUS_OPTIONS = Object.values(DebtStatus).map((value) => ({
  value,
  label: DEBT_STATUS_LABELS[value],
}));

export const DEBT_OPEN_STATUSES: DebtStatus[] = ['ACTIVE', 'RENEGOTIATED', 'SUSPENDED'];
export const DEBT_CLOSED_STATUSES: DebtStatus[] = ['PAID', 'CANCELLED'];
