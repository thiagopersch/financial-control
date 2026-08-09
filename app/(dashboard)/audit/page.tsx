import { authOptions } from '@/lib/auth-options';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AuditView } from './audit-view';

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AuditView />;
}
