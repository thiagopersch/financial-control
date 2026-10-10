import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ScheduledTransaction {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'BUSINESS_DAYS' | 'CUSTOM';
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  customDays: number[];
  nextRun: string;
  lastRun: string | null;
  createdAt: string;
  /** Quantidade de transações já geradas por este agendamento. */
  generatedCount: number;
  isActive: boolean;
  categoryId: string;
  category?: {
    name: string;
    color: string;
  };
  accountId: string | null;
  paymentMethodId: string | null;
  creditCardId: string | null;
  costCenterId: string | null;
  supplierId: string | null;
  supplier?: {
    name: string;
  } | null;
}

export function useScheduledTransactions() {
  const { data, error, isLoading, mutate } = useSWR<{ transactions: ScheduledTransaction[] }>(
    '/api/scheduled-transactions',
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    transactions: data?.transactions || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR<{
    categories: { id: string; name: string; color?: string; type: string }[];
  }>('/api/categories', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    categories: data?.categories || [],
    isLoading,
    isError: error,
  };
}
