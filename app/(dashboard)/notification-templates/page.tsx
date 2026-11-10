import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getNotificationTemplates } from '@/lib/queries/notification-templates';
import { getWorkspaceUsers } from '@/lib/queries/users';
import { redirect } from 'next/navigation';
import { NotificationTemplatesClient } from './notification-templates-client';

export default async function NotificationTemplatesPage() {
  const session = await getSession();
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'notification-templates', 'VIEW')) {
    redirect('/dashboard');
  }

  const [templates, users] = await Promise.all([getNotificationTemplates(), getWorkspaceUsers()]);

  return (
    <div className="animate-in fade-in py-6 duration-700">
      <NotificationTemplatesClient templates={templates} users={users} />
    </div>
  );
}
