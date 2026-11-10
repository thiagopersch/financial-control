import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { redirect } from 'next/navigation';
import { AuditView } from './audit-view';

export default async function AuditPage() {
  const session = await getSession();
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'audit', 'VIEW')) {
    redirect('/dashboard');
  }

  return <AuditView />;
}
