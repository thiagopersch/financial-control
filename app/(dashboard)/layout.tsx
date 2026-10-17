import { DashboardShell } from '@/components/dashboard-shell';
import { PeriodTransitionProvider } from '@/components/period-transition';
import { runAllAlertChecks } from '@/lib/actions/notifications';
import { authOptions } from '@/lib/auth-options';
import { processDueScheduledEmails } from '@/lib/services/scheduled-email-runner';
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
      // Backup trigger; the cron route (/api/cron/scheduled-emails) is the primary one.
      .then(() => processDueScheduledEmails())
      .catch((error) => console.error('Error running background checks:', error));
  });

  return (
    <DashboardShell>
      <PeriodTransitionProvider>{children}</PeriodTransitionProvider>
    </DashboardShell>
  );
}
