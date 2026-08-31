import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AuditView } from './audit-view';

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'audit', 'VIEW')) {
    redirect('/dashboard');
  }

  return <AuditView />;
}
