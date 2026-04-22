import { type TransactionType } from '@prisma/client';
import useSWR, { type SWRConfiguration } from 'swr';

export interface CategoryDTO {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const categoriesKey = '/api/categories';

export function useCategories(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ categories: CategoryDTO[] }>(
    categoriesKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    categories: data?.categories || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCategoryById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ category: CategoryDTO }>(
    id ? `/api/categories/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    category: data?.category || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
