import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ForecastData {
  month: string;
  predicted: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastSummary {
  totalPredicted: number;
  averageGrowth: number;
  trend: 'up' | 'down' | 'stable';
}

export function useForecast(months: number = 6) {
  const { data, error, isLoading, mutate } = useSWR<{
    forecast: ForecastData[];
    summary: ForecastSummary;
  }>(`/api/forecast?months=${months}`, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    forecast: data?.forecast || [],
    summary: data?.summary || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
