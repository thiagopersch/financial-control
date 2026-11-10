import useSWR from 'swr';

export interface DREResponse<TChart = unknown, TCategory = unknown> {
  summary: { totalRevenue: number; totalExpense: number; netResult: number } | null;
  chartData: TChart[];
  expensesByCategory: TCategory[];
}

/** DRE dos últimos `months` meses (SWR: cache, dedupe e dados anteriores na troca). */
export function useDRE<TChart, TCategory>(months: string | number) {
  const { data, error, isLoading, mutate } = useSWR<DREResponse<TChart, TCategory>>(
    `/api/dre?months=${months}`,
  );
  return {
    summary: data?.summary ?? null,
    chartData: data?.chartData ?? [],
    expensesByCategory: data?.expensesByCategory ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
