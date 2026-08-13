import { NotificationSettingsForm } from '@/components/profiles/notification-settings-form';
import { NotificationTemplatesSection } from '@/components/profiles/notification-templates-section';
import { TestNotificationForm } from '@/components/profiles/test-notification-form';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [workspace, users] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: session.user.workspaceId } }),
    prisma.user.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    }),
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
        }}
      />

      <TestNotificationForm users={users} />

      <NotificationTemplatesSection />
    </div>
  );
}
