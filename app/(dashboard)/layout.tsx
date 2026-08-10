import { DashboardShell } from '@/components/dashboard-shell';
import { runAllAlertChecks } from '@/lib/actions/notifications';
import { authOptions } from '@/lib/auth-options';
import { processDueScheduledTransactions } from '@/lib/services/scheduled-transactions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { after } from 'next/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  after(() => {
    processDueScheduledTransactions()
      .then(() => runAllAlertChecks(session))
      .catch((error) => console.error('Error running background checks:', error));
  });

  return <DashboardShell>{children}</DashboardShell>;
}
