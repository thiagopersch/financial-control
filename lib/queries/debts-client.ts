import useSWR, { type SWRConfiguration } from 'swr';

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
  isActive: boolean;
  installments: number | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
