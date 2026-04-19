import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface CostCenter {
  id: string;
  name: string;
  description: string | null;
  color: string;
  parentId: string | null;
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
}

export function useCostCenters() {
  const { data, error, isLoading, mutate } = useSWR<{
    costCenters: CostCenter[];
  }>('/api/cost-centers', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    costCenters: data?.costCenters || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
