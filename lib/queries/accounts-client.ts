import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export function useAccounts() {
  const { data, error, isLoading, mutate } = useSWR<{ accounts: Account[] }>("/api/accounts", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    accounts: data?.accounts || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}