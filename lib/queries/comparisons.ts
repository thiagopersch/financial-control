import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ComparisonData {
  category: string;
  currentPeriod: number;
  previousPeriod: number;
  percentageChange: number;
}

export function useComparisons(type: string = 'category') {
  const { data, error, isLoading, mutate } = useSWR<{
    comparisons: ComparisonData[];
  }>(`/api/comparisons?type=${type}`, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    comparisons: data?.comparisons || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
