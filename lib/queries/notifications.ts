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

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<{
    notifications: Notification[];
    unreadCount: number;
  }>('/api/notifications', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
