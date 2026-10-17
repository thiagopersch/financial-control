import type { ScheduledEmailDTO, ScheduledEmailLogDTO } from '@/lib/queries/scheduled-emails';
import useSWR from 'swr';

export type { ScheduledEmailDTO, ScheduledEmailLogDTO };

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Erro ao carregar');
  return res.json();
};

export function getScheduledEmailsKey(page: number, pageSize: number) {
  return `/api/scheduled-emails?page=${page}&pageSize=${pageSize}`;
}

export function useScheduledEmails(page = 1, pageSize = 20) {
  const { data, error, isLoading, mutate } = useSWR<
    Paginated<ScheduledEmailDTO> & { smtpConfigured: boolean }
  >(getScheduledEmailsKey(page, pageSize), fetcher, { revalidateOnFocus: false });

  return {
    scheduledEmails: data?.items ?? [],
    total: data?.total ?? 0,
    smtpConfigured: data?.smtpConfigured ?? true,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useScheduledEmailLogs(id: string | null, page = 1, pageSize = 10) {
  const { data, error, isLoading } = useSWR<Paginated<ScheduledEmailLogDTO>>(
    id ? `/api/scheduled-emails/${id}/logs?page=${page}&pageSize=${pageSize}` : null,
    fetcher,
  );
  return { logs: data?.items ?? [], total: data?.total ?? 0, isLoading, isError: error };
}
