import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ChartDataPoint {
  label: string;
  current: number;
  previous: number;
}

export interface ComparisonSummary {
  incomeChange: number;
  expenseChange: number;
  netChange: number;
}

export function useComparisons(type: string = 'month') {
  const { data, error, isLoading, mutate } = useSWR<{
    chartData: ChartDataPoint[];
    summary: ComparisonSummary;
  }>(`/api/comparisons?type=${type}`, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    chartData: data?.chartData || [],
    summary: data?.summary || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
