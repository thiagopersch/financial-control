import useSWR, { type SWRConfiguration } from 'swr';

export interface BudgetDTO {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertAt80: boolean;
  alertAt100: boolean;
  workspaceId: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  spentAmount?: number;
  remaining?: number;
  percentage?: number;
  status?: 'safe' | 'warning' | 'exceeded';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const budgetsKey = '/api/budgets';

export function useBudgets(month?: number, year?: number, options?: SWRConfiguration) {
  const queryKey = month && year ? `/api/budgets?month=${month}&year=${year}` : budgetsKey;
  const { data, error, isLoading, mutate } = useSWR<{ budgets: BudgetDTO[] }>(queryKey, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  return {
    budgets: data?.budgets || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useBudgetById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ budget: BudgetDTO }>(
    id ? `/api/budgets/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    budget: data?.budget || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
