import useSWR, { type SWRConfiguration } from 'swr';

export interface NotificationTemplateDTO {
  id: string;
  name: string;
  type: string;
  channel: 'EMAIL' | 'WHATSAPP';
  subject: string;
  bodyHtml: string;
  bodyWhatsapp: string;
  content: unknown;
  imageUrl: string | null;
  isActive: boolean;
  workspaceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const notificationTemplatesKey = '/api/notification-templates';

export function useNotificationTemplates(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ templates: NotificationTemplateDTO[] }>(
    notificationTemplatesKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    templates: data?.templates || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
