import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
}

export function useCashFlow(days: number = 30) {
  const { data, error, isLoading, mutate } = useSWR<{
    data: CashFlowData[];
    summary: CashFlowSummary;
  }>(`/api/cash-flow?days=${days}`, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    data: data?.data || [],
    summary: data?.summary || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
