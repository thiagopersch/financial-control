import { NotificationSettingsForm } from '@/components/profiles/notification-settings-form';
import { TestNotificationForm } from '@/components/profiles/test-notification-form';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { DEFAULT_EXTERNAL_API_TIMEOUT_MS } from '@/lib/http/fetch-with-timeout';
import prisma from '@/lib/prisma';
import { getWorkspaceUsers } from '@/lib/queries/users';
import { redirect } from 'next/navigation';

export default async function SystemSettingsPage() {
  const session = await getSession();
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'system-settings', 'VIEW')) {
    redirect('/dashboard');
  }

  const [workspace, users] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: session.user.workspaceId } }),
    getWorkspaceUsers(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Definições do Sistema</h1>
        <p className="text-muted-foreground">
          Configurações administrativas da organização, incluindo integrações de notificação.
        </p>
      </div>

      <NotificationSettingsForm
        initialValues={{
          whatsappApiUrl: workspace?.whatsappApiUrl || '',
          whatsappApiToken: workspace?.whatsappApiToken || '',
          smtpHost: workspace?.smtpHost || '',
          smtpPort: workspace?.smtpPort || undefined,
          smtpUser: workspace?.smtpUser || '',
          smtpPassword: workspace?.smtpPassword || '',
          smtpFrom: workspace?.smtpFrom || '',
          externalApiTimeoutMs: workspace?.externalApiTimeoutMs ?? DEFAULT_EXTERNAL_API_TIMEOUT_MS,
        }}
      />

      <TestNotificationForm users={users} />
    </div>
  );
}
