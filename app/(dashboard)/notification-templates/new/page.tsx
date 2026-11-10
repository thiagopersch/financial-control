import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { redirect } from 'next/navigation';
import { TemplateBuilder } from '@/components/notification-templates/builder/template-builder';

export default async function NewNotificationTemplatePage() {
  const session = await getSession();
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
