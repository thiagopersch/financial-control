import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  lastDayOfMonth,
  setDate,
  startOfMonth,
} from 'date-fns';

const DEFAULT_DUE_DAY = 10;

export type PeriodicityType =
  | 'UNIQUE'
  | 'WEEKLY'
  | 'FORTNIGHTLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';

export function divideExactly(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  if (parts === 1) return [Math.round(total * 100) / 100];

  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / parts);
  const remainder = totalCents - baseCents * parts;

  const values: number[] = [];
  for (let i = 0; i < parts; i++) {
    const extra = i < remainder ? 1 : 0;
    values.push((baseCents + extra) / 100);
  }
  return values;
}

export function calculateInstallmentAmount(
  remainingValue: number,
  remainingCount: number,
  calculationType: string | null,
  installmentValue: number | null,
): number {
  if (calculationType === 'FIXED_INSTALLMENT' && installmentValue) {
    return installmentValue;
  }
  if (remainingCount <= 0) return 0;
  return Math.round((remainingValue / remainingCount) * 100) / 100;
}

export function calculateInstallmentAmounts(
  totalValue: number,
  installmentCount: number,
  calculationType: string | null,
  installmentValue: number | null,
): number[] {
  if (calculationType === 'FIXED_INSTALLMENT' && installmentValue) {
    return Array(installmentCount).fill(installmentValue);
  }
  return divideExactly(totalValue, installmentCount);
}

function clampToMonth(date: Date): Date {
  const lastDay = lastDayOfMonth(date);
  const requestedDay = date.getDate();
  const maxDay = lastDay.getDate();
  if (requestedDay > maxDay) {
    return setDate(date, maxDay);
  }
  return date;
}

export function calculateNextDueDate(
  startDate: Date,
  periodicity: PeriodicityType | string | null,
  index: number,
): Date {
  if (index === 0) return startDate;

  const p = (periodicity || 'MONTHLY') as PeriodicityType;

  switch (p) {
    case 'UNIQUE':
      return startDate;
    case 'WEEKLY':
      return addWeeks(startDate, index);
    case 'FORTNIGHTLY':
      return addDays(startDate, index * 14);
    case 'MONTHLY':
      return clampToMonth(addMonths(startDate, index));
    case 'BIMONTHLY':
      return clampToMonth(addMonths(startDate, index * 2));
    case 'QUARTERLY':
      return clampToMonth(addMonths(startDate, index * 3));
    case 'SEMIANNUAL':
      return clampToMonth(addMonths(startDate, index * 6));
    case 'ANNUAL':
      return clampToMonth(addYears(startDate, index));
    default:
      return clampToMonth(addMonths(startDate, index));
  }
}

export function getInstallmentDueDate(
  monthOffset: number,
  firstInstallmentMonth: string | null,
  dueDay: number | null,
): Date {
  const now = new Date();
  const baseMonth =
    firstInstallmentMonth === 'CURRENT' ? startOfMonth(now) : startOfMonth(addMonths(now, 1));
  const monthDate = addMonths(baseMonth, monthOffset);
  const day = dueDay || DEFAULT_DUE_DAY;
  const lastDay = lastDayOfMonth(monthDate).getDate();
  return setDate(monthDate, Math.min(day, lastDay));
}

export function buildInstallmentDates(
  firstInstallmentDate: Date | null | undefined,
  firstInstallmentMonth: string | null | undefined,
  dueDay: number | null | undefined,
  periodicity: string | null | undefined,
  count: number,
): Date[] {
  if (firstInstallmentDate) {
    return Array.from({ length: count }, (_, i) =>
      calculateNextDueDate(firstInstallmentDate, periodicity || 'MONTHLY', i),
    );
  }

  return Array.from({ length: count }, (_, i) =>
    getInstallmentDueDate(i, firstInstallmentMonth ?? null, dueDay ?? null),
  );
}
