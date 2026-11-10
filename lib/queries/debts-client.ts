import useSWR, { type SWRConfiguration } from 'swr';
import { CalculationType, DebtStatus, FirstInstallmentMonth, Periodicity } from '@prisma/client';

export interface DebtDTO {
  id: string;
  name: string;
  description: string | null;
  initialValue: number;
  currentValue: number;
  interestRate: number | null;
  minimumPayment: number;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
  status: DebtStatus;
  installments: number | null;
  calculationType: CalculationType | null;
  installmentValue: number | null;
  firstInstallmentMonth: FirstInstallmentMonth | null;
  periodicity: Periodicity | null;
  firstInstallmentDate: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

import { fetcher } from '@/lib/queries/fetcher';

const debtsKey = '/api/debts';

export function useDebts(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ debts: DebtDTO[] }>(debtsKey, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  return {
    debts: data?.debts || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useDebtById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ debt: DebtDTO }>(
    id ? `/api/debts/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    debt: data?.debt || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
