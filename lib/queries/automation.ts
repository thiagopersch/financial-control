import useSWR from 'swr';

import { fetcher } from '@/lib/queries/fetcher';

export interface ConditionalRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: any;
  actions: any;
  createdAt: string;
}

export function useConditionalRules() {
  const { data, error, isLoading, mutate } = useSWR<{ rules: ConditionalRule[] }>(
    '/api/conditional-rules',
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    rules: data?.rules || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
