import useSWR, { type SWRConfiguration } from 'swr';
import type { PermissionProfileDTO } from '@/lib/queries/permission-profiles';
import type { PermissionTreeNode } from '@/lib/services/permission-profiles';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const permissionProfilesKey = '/api/permission-profiles';
const permissionCatalogKey = '/api/permission-profiles/catalog';

export function usePermissionProfiles(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ profiles: PermissionProfileDTO[] }>(
    permissionProfilesKey,
    fetcher,
    { revalidateOnFocus: false, ...options },
  );

  return {
    profiles: data?.profiles || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function usePermissionCatalog(options?: SWRConfiguration) {
  const { data, error, isLoading } = useSWR<{ catalog: PermissionTreeNode[] }>(
    permissionCatalogKey,
    fetcher,
    { revalidateOnFocus: false, ...options },
  );

  return {
    catalog: data?.catalog || [],
    isLoading,
    isError: error,
  };
}
