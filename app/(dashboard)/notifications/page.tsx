import { authOptions } from '@/lib/auth-options';
import { getServerSession } from 'next-auth';
import { NotificationsView } from './notifications-view';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return <NotificationsView />;
}
