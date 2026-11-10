import useSWR from 'swr';

export interface ForecastResponse<TChart = unknown, TCategory = unknown> {
  chartData: TChart[];
  categoryForecast: TCategory[];
}

/** Previsão de despesas para os próximos `months` meses. */
export function useForecast<TChart, TCategory>(months: string | number) {
  const { data, error, isLoading, mutate } = useSWR<ForecastResponse<TChart, TCategory>>(
    `/api/forecast?months=${months}`,
  );
  return {
    chartData: data?.chartData ?? [],
    categoryForecast: data?.categoryForecast ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
