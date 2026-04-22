import useSWR, { type SWRConfiguration } from 'swr';

export interface GoalDTO {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  isActive: boolean;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const goalsKey = '/api/goals';

export function useGoals(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ goals: GoalDTO[] }>(goalsKey, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  return {
    goals: data?.goals || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useGoalById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ goal: GoalDTO }>(
    id ? `/api/goals/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    goal: data?.goal || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
