import useSWRInfinite from 'swr/infinite';

import { markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/actions/notifications';

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

interface NotificationsPage {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export const NOTIFICATIONS_PAGE_SIZE = 30;

const pageKey = (index: number, previous: NotificationsPage | null) => {
  if (previous && previous.notifications.length < NOTIFICATIONS_PAGE_SIZE) return null;
  return `/api/notifications?page=${index + 1}&limit=${NOTIFICATIONS_PAGE_SIZE}`;
};

/**
 * Notificações paginadas (useSWRInfinite). O sino e a página /notifications
 * usam as mesmas chaves — uma única requisição por página, compartilhada e
 * deduplicada. "Marcar como lida" atualiza a tela na hora (otimista) e desfaz
 * se a Server Action falhar.
 */
export function useNotifications() {
  const { data, error, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite<NotificationsPage>(pageKey, {
      revalidateOnFocus: true,
      refreshInterval: 60_000,
      // Só a primeira página é reconsultada no polling; as demais vêm do cache.
      revalidateFirstPage: true,
      revalidateAll: false,
    });

  const pages = data ?? [];
  const notifications = pages.flatMap((page) => page.notifications);
  const unreadCount = pages[0]?.unreadCount ?? 0;
  const total = pages[0]?.total ?? 0;

  const markRead = async (id: string) => {
    await mutate(
      async (current) => {
        const result = await markNotificationAsRead(id);
        if (!result.success) throw new Error(result.error);
        return current;
      },
      {
        optimisticData: (current) =>
          (current ?? []).map((page, index) => ({
            ...page,
            unreadCount: index === 0 ? Math.max(0, page.unreadCount - 1) : page.unreadCount,
            notifications: page.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          })),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    );
  };

  const markAllRead = async () => {
    await mutate(
      async (current) => {
        const result = await markAllNotificationsAsRead();
        if (!result.success) throw new Error(result.error);
        return current;
      },
      {
        optimisticData: (current) =>
          (current ?? []).map((page) => ({
            ...page,
            unreadCount: 0,
            notifications: page.notifications.map((n) => ({ ...n, isRead: true })),
          })),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    );
  };

  return {
    notifications,
    unreadCount,
    total,
    isLoading,
    isLoadingMore: isValidating && size > pages.length,
    hasMore: notifications.length < total,
    loadMore: () => setSize(size + 1),
    markRead,
    markAllRead,
    isError: !!error,
    refresh: mutate,
  };
}
