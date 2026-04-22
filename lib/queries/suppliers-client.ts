import useSWR, { type SWRConfiguration } from 'swr';

export interface SupplierDTO {
  id: string;
  name: string;
  document: string | null;
  contact: string | null;
  address: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const suppliersKey = '/api/suppliers';

export function useSuppliers(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ suppliers: SupplierDTO[] }>(
    suppliersKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    suppliers: data?.suppliers || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useSupplierById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ supplier: SupplierDTO }>(
    id ? `/api/suppliers/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    supplier: data?.supplier || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
