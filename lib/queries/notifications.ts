import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  isRead: boolean;
  link?: string;
  metadata?: any;
  createdAt: string;
}

export function useNotifications(limit: number = 30) {
  const { data, error, isLoading, mutate } = useSWR<{
    notifications: Notification[];
    unreadCount: number;
    total: number;
  }>(`/api/notifications?page=1&limit=${limit}`, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    total: data?.total || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
