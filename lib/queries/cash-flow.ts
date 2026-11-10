import useSWR from 'swr';

export interface CashFlowResponse<TChart = unknown, TSummary = unknown> {
  chartData: TChart[];
  summary: TSummary | null;
}

/** Projeção de fluxo de caixa para os próximos `days` dias. */
export function useCashFlow<TChart, TSummary>(days: string | number) {
  const { data, error, isLoading, mutate } = useSWR<CashFlowResponse<TChart, TSummary>>(
    `/api/cash-flow?days=${days}`,
  );
  return {
    chartData: data?.chartData ?? [],
    summary: data?.summary ?? null,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
