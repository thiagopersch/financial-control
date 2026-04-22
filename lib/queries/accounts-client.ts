import { type AccountType } from '@prisma/client';
import useSWR, { type SWRConfiguration } from 'swr';

export interface AccountDTO {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const accountsKey = '/api/accounts';

export function useAccounts(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ accounts: AccountDTO[] }>(
    accountsKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    accounts: data?.accounts || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useAccountById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ account: AccountDTO }>(
    id ? `/api/accounts/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    account: data?.account || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
