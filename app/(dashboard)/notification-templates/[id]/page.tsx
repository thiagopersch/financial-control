import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getNotificationTemplate } from '@/lib/queries/notification-templates';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { TemplateBuilder } from '@/components/notification-templates/builder/template-builder';

export default async function EditNotificationTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'notification-templates', 'UPDATE')) {
    redirect('/notification-templates');
  }

  const template = await getNotificationTemplate(id);
  if (!template) notFound();

  return (
    <div className="animate-in fade-in py-6 duration-700">
      <TemplateBuilder template={template} />
    </div>
  );
}
