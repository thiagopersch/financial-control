'use client';

import { NotificationTemplatesList } from './components/notification-templates-list';
import type { NotificationTemplateDTO } from '@/lib/queries/notification-templates';
import type { WorkspaceUserOption } from '@/lib/queries/users';
import { useRouter } from 'next/navigation';

interface NotificationTemplatesClientProps {
  templates: NotificationTemplateDTO[];
  users: WorkspaceUserOption[];
}

export function NotificationTemplatesClient({
  templates,
  users,
}: NotificationTemplatesClientProps) {
  const router = useRouter();
  return (
    <NotificationTemplatesList
      templates={templates}
      users={users}
      onRefresh={() => router.refresh()}
    />
  );
}
