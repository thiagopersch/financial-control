import useSWR, { type SWRConfiguration } from 'swr';

export interface CostCenterDTO {
  id: string;
  name: string;
  description: string | null;
  color: string;
  parentId: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const costCentersKey = '/api/cost-centers';

export function useCostCenters(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ costCenters: CostCenterDTO[] }>(
    costCentersKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    costCenters: data?.costCenters || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCostCenterById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ costCenter: CostCenterDTO }>(
    id ? `/api/cost-centers/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    costCenter: data?.costCenter || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
