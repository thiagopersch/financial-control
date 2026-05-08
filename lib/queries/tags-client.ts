import type { TagDTO } from '@/lib/queries/tags';
import useSWR, { type SWRConfiguration } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const tagsKey = '/api/tags';

export function useTags(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ tags: TagDTO[] }>(tagsKey, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  return {
    tags: data?.tags || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
