import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export function useAuditLogs(params?: { entity?: string; action?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.entity && params.entity !== 'all') queryParams.set('entity', params.entity);
  if (params?.action && params.action !== 'all') queryParams.set('action', params.action);
  if (params?.search) queryParams.set('search', params.search);

  const key = queryParams.toString() ? `/api/audit?${queryParams}` : '/api/audit';

  const { data, error, isLoading, mutate } = useSWR<{ logs: AuditLog[] }>(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    logs: data?.logs || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
