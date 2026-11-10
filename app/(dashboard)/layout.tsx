import { Providers } from '@/app/providers';
import { DashboardShell } from '@/components/dashboard-shell';
import { PeriodTransitionProvider } from '@/components/period-transition';
import { getSession } from '@/lib/auth/session';
import { enqueueThrottled } from '@/lib/queue';
import { redirect } from 'next/navigation';
import { after } from 'next/server';

/** Janelas mínimas entre execuções dos gatilhos disparados pela navegação. */
const ALERTS_WINDOW_SEC = 10 * 60;
const SCHEDULED_WINDOW_SEC = 5 * 60;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const actor = { workspaceId: session.user.workspaceId, userId: session.user.id };

  // Antes isso rodava a cada navegação. Agora vai para a fila, no máximo uma vez
  // por janela (lock no Redis); o cron (/api/cron/scheduled-emails) é o gatilho principal
  // dos agendamentos e este é o de reserva.
  after(() =>
    Promise.all([
      enqueueThrottled(`alerts:${actor.userId}`, ALERTS_WINDOW_SEC, 'alerts.check', actor),
      enqueueThrottled('scheduled', SCHEDULED_WINDOW_SEC, 'scheduled.process', {}),
      enqueueThrottled(
        `auto-move:${actor.workspaceId}`,
        SCHEDULED_WINDOW_SEC,
        'transactions.auto-move-overdue',
        actor,
      ),
    ]).catch((error) => console.error('Error enqueueing background checks:', error)),
  );

  return (
    // Sessão do servidor já resolvida: o client não precisa buscar /api/auth/session.
    // (O layout raiz não lê a sessão para que as páginas de login possam ser estáticas.)
    <Providers session={session}>
      <DashboardShell>
        <PeriodTransitionProvider>{children}</PeriodTransitionProvider>
      </DashboardShell>
    </Providers>
  );
}
