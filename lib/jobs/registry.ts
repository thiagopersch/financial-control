import * as z from 'zod';

/**
 * Registro dos jobs da fila (`lib/queue`). Cada job tem um schema Zod (o
 * payload vem da rede e é sempre revalidado) e um handler. Os handlers são
 * importados sob demanda para o endpoint `/api/jobs/[job]` não carregar tudo.
 */
const actorSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
});

export const JOB_SCHEMAS = {
  /** Alertas de orçamento, faturas, metas, vencimentos e limite de cartão. */
  'alerts.check': actorSchema,
  /** Só o alerta de orçamento (depois de criar/editar uma despesa). */
  'alerts.budget': actorSchema,
  /** Só o alerta de metas (depois de editar uma meta). */
  'alerts.goal': actorSchema,
  /** Notificação "Nova transação" + entrega por e-mail/WhatsApp. */
  'transactions.notify-created': actorSchema.extend({ transactionId: z.string().min(1) }),
  /** Notificação de mudança de status + entrega por e-mail/WhatsApp. */
  'transactions.notify-status': actorSchema.extend({
    transactionId: z.string().min(1),
    oldStatus: z.string(),
    newStatus: z.string(),
  }),
  /** Move para o mês atual as transações vencidas com auto-mover ligado. */
  'transactions.auto-move-overdue': actorSchema,
  /** Varre agendamentos (transações e e-mails) vencidos e dispara um job por e-mail. */
  'scheduled.process': z.object({}),
  /** Envia um e-mail agendado já reservado (claim) pelo `scheduled.process`. */
  'scheduled-emails.run': z.object({
    scheduledEmailId: z.string().min(1),
    nextRun: z.iso.datetime(),
  }),
} as const;

export type JobName = keyof typeof JOB_SCHEMAS;
export type JobPayload<N extends JobName> = z.infer<(typeof JOB_SCHEMAS)[N]>;

export function isJobName(value: string): value is JobName {
  return Object.prototype.hasOwnProperty.call(JOB_SCHEMAS, value);
}

type Handlers = { [N in JobName]: (payload: JobPayload<N>) => Promise<unknown> };

const handlers: Handlers = {
  'alerts.check': async (actor) => {
    const { runAllAlertChecks } = await import('@/lib/services/alerts');
    return runAllAlertChecks(actor);
  },
  'alerts.budget': async (actor) => {
    const { checkBudgetAlerts } = await import('@/lib/services/alerts');
    return checkBudgetAlerts(actor);
  },
  'alerts.goal': async (actor) => {
    const { checkGoalAlerts } = await import('@/lib/services/alerts');
    return checkGoalAlerts(actor);
  },
  'transactions.notify-created': async ({ transactionId, ...actor }) => {
    const { notifyNewTransaction } = await import('@/lib/services/alerts');
    return notifyNewTransaction(actor, transactionId);
  },
  'transactions.notify-status': async ({ transactionId, oldStatus, newStatus, ...actor }) => {
    const { notifyTransactionStatusChange } = await import('@/lib/services/alerts');
    return notifyTransactionStatusChange(actor, { id: transactionId, oldStatus, newStatus });
  },
  'transactions.auto-move-overdue': async (actor) => {
    const { autoMoveOverdueTransactions } = await import('@/lib/services/transaction-maintenance');
    return autoMoveOverdueTransactions(actor);
  },
  'scheduled.process': async () => {
    const [{ processDueScheduledTransactions }, { processDueScheduledEmails }] = await Promise.all([
      import('@/lib/services/scheduled-transactions'),
      import('@/lib/services/scheduled-email-runner'),
    ]);
    const transactions = await processDueScheduledTransactions();
    const emails = await processDueScheduledEmails();
    return { transactions, emails };
  },
  'scheduled-emails.run': async ({ scheduledEmailId, nextRun }) => {
    const { runClaimedScheduledEmail } = await import('@/lib/services/scheduled-email-runner');
    return runClaimedScheduledEmail(scheduledEmailId, new Date(nextRun));
  },
};

/** Valida o payload e executa o job. Lança erro para a fila reprocessar. */
export async function runJob<N extends JobName>(name: N, payload: unknown) {
  const parsed = JOB_SCHEMAS[name].parse(payload) as JobPayload<N>;
  return (handlers[name] as (p: JobPayload<N>) => Promise<unknown>)(parsed);
}
