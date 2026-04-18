import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Debt {
  id: string;
  name: string;
  description: string | null;
  initialValue: number;
  currentValue: number;
  interestRate: number | null;
  minimumPayment: number;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export function useDebts() {
  const { data, error, isLoading, mutate } = useSWR<{ debts: Debt[] }>("/api/debts", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    debts: data?.debts || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
