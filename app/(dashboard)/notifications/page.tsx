import { getSession } from '@/lib/auth/session';
import { NotificationsView } from './notifications-view';

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;

  return <NotificationsView />;
}
