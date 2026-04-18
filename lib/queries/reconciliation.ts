import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  matched: boolean;
}

export interface ReconciliationStats {
  total: number;
  matched: number;
  pending: number;
  disputed: number;
}

export function useReconciliation() {
  const { data, error, isLoading, mutate } = useSWR<{
    transactions: BankTransaction[];
    stats: ReconciliationStats;
  }>("/api/reconciliation", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    transactions: data?.transactions || [],
    stats: data?.stats || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
