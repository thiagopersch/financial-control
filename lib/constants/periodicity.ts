import { Periodicity } from '@prisma/client';

export const PERIODICITY_LABELS: Record<Periodicity, string> = {
  UNIQUE: 'Única',
  WEEKLY: 'Semanal',
  FORTNIGHTLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

export const PERIODICITY_OPTIONS: { value: Periodicity; label: string }[] = (
  Object.keys(PERIODICITY_LABELS) as Periodicity[]
).map((value) => ({ value, label: PERIODICITY_LABELS[value] }));
