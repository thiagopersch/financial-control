import useSWR from "swr";
import {
  createScheduledTransaction,
  deleteScheduledTransaction,
  toggleScheduledTransaction,
} from "@/lib/actions/scheduled";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ScheduledTransaction {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "BUSINESS_DAYS";
  dayOfMonth: number | null;
  nextRun: string;
  isActive: boolean;
  category?: {
    name: string;
    color: string;
  };
}

export function useScheduledTransactions() {
  const { data, error, isLoading, mutate } = useSWR<{ transactions: ScheduledTransaction[] }>(
    "/api/scheduled-transactions",
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    transactions: data?.transactions || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR<{ categories: { id: string; name: string }[] }>(
    "/api/categories",
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    categories: data?.categories || [],
    isLoading,
    isError: error,
  };
}
