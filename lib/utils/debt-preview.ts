import {
  calculateInstallmentAmounts,
  buildInstallmentDates,
  divideExactly,
} from '@/lib/utils/installment-calculation';
import { Periodicity, TransactionStatus } from '@prisma/client';
import { startOfDay } from 'date-fns';

export interface InstallmentPreviewItem {
  installmentNumber: number;
  totalInstallments: number;
  dueDate: Date;
  amount: number;
  status: TransactionStatus;
}

export interface InstallmentPreviewParams {
  initialValue?: number;
  installments?: number;
  calculationType?: string;
  installmentValue?: number | null;
  firstInstallmentDate?: Date | string | null;
  firstInstallmentMonth?: string | null;
  dueDay?: number | null;
  periodicity?: Periodicity | string | null;
}

export function calculateInstallmentPreview(params: InstallmentPreviewParams): {
  items: InstallmentPreviewItem[];
  firstDueDate: Date | null;
  lastDueDate: Date | null;
  total: number;
  sum: number;
} {
  const totalValue = Number(params.initialValue) || 0;
  const count = Math.max(Number(params.installments) || 0, 0);

  if (totalValue <= 0 || count <= 0) {
    return { items: [], firstDueDate: null, lastDueDate: null, total: totalValue, sum: 0 };
  }

  const calculationType =
    params.calculationType === 'FIXED_INSTALLMENT' ? 'FIXED_INSTALLMENT' : 'TOTAL_DIVIDED';

  const firstDate =
    typeof params.firstInstallmentDate === 'string' && params.firstInstallmentDate
      ? new Date(params.firstInstallmentDate)
      : params.firstInstallmentDate instanceof Date
        ? params.firstInstallmentDate
        : null;

  const amounts = calculateInstallmentAmounts(
    totalValue,
    count,
    calculationType,
    Number(params.installmentValue) || null,
  );

  const dates = firstDate
    ? buildInstallmentDates(
        firstDate,
        params.firstInstallmentMonth,
        params.dueDay,
        params.periodicity || 'MONTHLY',
        count,
      )
    : buildInstallmentDates(
        null,
        params.firstInstallmentMonth,
        params.dueDay,
        params.periodicity || 'MONTHLY',
        count,
      );

  const today = startOfDay(new Date());

  const items: InstallmentPreviewItem[] = dates.map((dueDate, i) => ({
    installmentNumber: i + 1,
    totalInstallments: count,
    dueDate,
    amount: amounts[i] || 0,
    status: dueDate < today ? TransactionStatus.OVERDUE : TransactionStatus.PENDING,
  }));

  return {
    items,
    firstDueDate: dates.length > 0 ? dates[0] : null,
    lastDueDate: dates.length > 0 ? dates[dates.length - 1] : null,
    total: totalValue,
    sum: items.reduce((s, item) => s + item.amount, 0),
  };
}

export { divideExactly };
