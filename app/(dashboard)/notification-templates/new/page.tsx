import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { TemplateBuilder } from '@/components/notification-templates/builder/template-builder';

export default async function NewNotificationTemplatePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'notification-templates', 'CREATE')) {
    redirect('/notification-templates');
  }

  return (
    <div className="animate-in fade-in py-6 duration-700">
      <TemplateBuilder template={null} />
    </div>
  );
}
