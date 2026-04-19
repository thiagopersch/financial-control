import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface DREItem {
  description: string;
  currentMonth: number;
  previousMonth: number;
  ytd: number;
  percentageChange: number;
}

export interface DREData {
  items: DREItem[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export function useDRE(months: number = 12) {
  const { data, error, isLoading, mutate } = useSWR<{ dre: DREData }>(
    `/api/dre?months=${months}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    dre: data?.dre || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
