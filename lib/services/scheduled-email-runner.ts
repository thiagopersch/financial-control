import { DEFAULT_REPORT_TEMPLATES } from '@/lib/notification-templates/default-report-templates';
import {
  applyConditionals,
  interpolate,
  stripHtml,
} from '@/lib/notification-templates/interpolate';
import { renderBlockTreeToHtml, resolveEmailBodyHtml } from '@/lib/notification-templates/render';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { enqueue } from '@/lib/queue';
import { createSystemAuditLog } from '@/lib/services/audit';
import { buildReport, detectDataSources } from '@/lib/services/email-reports';
import { computeNextEmailRun } from '@/lib/services/email-schedule';
import { sendEmailOrThrow } from '@/lib/services/notification-delivery';
import type { EmailDeliveryStatus, NotificationTemplate, ScheduledEmail } from '@prisma/client';

export interface RunResult {
  status: EmailDeliveryStatus;
  error?: string;
}

type ScheduleWithTemplate = ScheduledEmail & { template: NotificationTemplate | null };

/** Renders subject/html for a schedule: its own template, or the built-in default. */
export function resolveScheduleTemplate(schedule: ScheduleWithTemplate) {
  const template =
    schedule.template?.isActive && schedule.template.channel === 'EMAIL' ? schedule.template : null;
  if (template) {
    return {
      subject: template.subject,
      html: resolveEmailBodyHtml(template),
      imageUrl: template.imageUrl,
    };
  }
  const fallback = DEFAULT_REPORT_TEMPLATES[schedule.reportType];
  return {
    subject: fallback.subject,
    html: renderBlockTreeToHtml(fallback.blocks),
    imageUrl: null,
  };
}

export async function renderScheduledEmail(schedule: ScheduleWithTemplate, now = new Date()) {
  const { subject, html, imageUrl } = resolveScheduleTemplate(schedule);
  const report = await buildReport(schedule, detectDataSources(html), now);
  const body = interpolate(applyConditionals(html, report.vars), report.vars);
  return {
    subject: interpolate(subject, report.vars) || schedule.name,
    html: body,
    text: stripHtml(body),
    imageUrl,
    attachments: report.attachments,
    itemsCount: report.itemsCount,
  };
}

/**
 * Builds and sends one schedule, recording a ScheduledEmailLog. `recipients`
 * overrides the configured To/CC (used by "enviar teste para mim").
 */
export async function runScheduledEmail(
  schedule: ScheduleWithTemplate,
  options: { manual?: boolean; recipients?: { to: string[]; cc: string[] } } = {},
): Promise<RunResult> {
  const to = options.recipients?.to ?? schedule.toEmails;
  const cc = options.recipients?.cc ?? schedule.ccEmails;
  const isPreview = Boolean(options.recipients);
  let subject = '';
  let itemsCount = 0;

  try {
    const rendered = await renderScheduledEmail(schedule);
    subject = isPreview ? `[Teste] ${rendered.subject}` : rendered.subject;
    itemsCount = rendered.itemsCount;

    if (schedule.skipIfEmpty && itemsCount === 0 && !options.manual) {
      await logRun(schedule.id, 'SKIPPED', [...to, ...cc], subject, itemsCount, false);
      return { status: 'SKIPPED' };
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: schedule.workspaceId } });
    await sendEmailOrThrow(workspace, {
      to,
      cc,
      subject,
      text: rendered.text,
      html: rendered.html,
      imageUrl: rendered.imageUrl,
      attachments: rendered.attachments,
    });

    if (!isPreview) {
      await logRun(
        schedule.id,
        'SENT',
        [...to, ...cc],
        subject,
        itemsCount,
        Boolean(options.manual),
      );
      await prisma.scheduledEmail.update({
        where: { id: schedule.id },
        data: { lastRun: new Date() },
      });
    }
    return { status: 'SENT' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.error(
      JSON.stringify({
        event: 'scheduled_email_failed',
        scheduledEmailId: schedule.id,
        error: message,
      }),
    );
    if (!isPreview) {
      await logRun(
        schedule.id,
        'FAILED',
        [...to, ...cc],
        subject,
        itemsCount,
        Boolean(options.manual),
        message,
      );
      await notifyFailure(schedule, message);
    }
    return { status: 'FAILED', error: message };
  }
}

async function logRun(
  scheduledEmailId: string,
  status: EmailDeliveryStatus,
  recipients: string[],
  subject: string,
  itemsCount: number,
  manual: boolean,
  error?: string,
) {
  try {
    await prisma.scheduledEmailLog.create({
      data: { scheduledEmailId, status, recipients, subject, itemsCount, manual, error },
    });
  } catch (e) {
    console.error('Error writing scheduled email log:', e);
  }
}

async function notifyFailure(schedule: ScheduledEmail, message: string) {
  try {
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Falha ao enviar e-mail agendado',
        message: `O agendamento "${schedule.name}" não foi enviado: ${message}`,
        level: 'CRITICAL',
        link: '/scheduled?tab=emails',
        userId: schedule.createdById,
        workspaceId: schedule.workspaceId,
      },
    });
  } catch (e) {
    console.error('Error notifying scheduled email failure:', e);
  }
}

/**
 * Reserva (claim) todo agendamento ativo cujo nextRun venceu: compare-and-set
 * no nextRun, então crons/gatilhos concorrentes nunca enviam a mesma
 * ocorrência duas vezes. Os claims rodam em paralelo (linhas independentes).
 */
export async function claimDueScheduledEmails(now = new Date()) {
  const due = await prisma.scheduledEmail.findMany({
    where: { isActive: true, nextRun: { lte: now } },
    orderBy: { nextRun: 'asc' },
    take: 100,
  });

  const claims = await Promise.all(
    due.map(async (schedule) => {
      const nextRun = computeNextEmailRun(schedule, now, schedule.nextRun);
      const claimed = await prisma.scheduledEmail.updateMany({
        where: { id: schedule.id, nextRun: schedule.nextRun, isActive: true },
        data: { nextRun },
      });
      return claimed.count > 0 ? { id: schedule.id, nextRun } : null;
    }),
  );
  return claims.filter((c): c is { id: string; nextRun: Date } => c !== null);
}

/** Envia um agendamento já reservado e registra a auditoria do cron. */
export async function runClaimedScheduledEmail(scheduledEmailId: string, nextRun: Date) {
  const schedule = await prisma.scheduledEmail.findUnique({
    where: { id: scheduledEmailId },
    include: { template: true },
  });
  if (!schedule) return { status: 'SKIPPED' as const };

  const result = await runScheduledEmail(schedule);
  await createSystemAuditLog({
    workspaceId: schedule.workspaceId,
    userId: schedule.createdById,
    action: 'RUN_SCHEDULED_EMAIL',
    entity: 'ScheduledEmail',
    entityId: schedule.id,
    newValue: { status: result.status, error: result.error, nextRun },
  });
  return result;
}

/**
 * Reserva os agendamentos vencidos e enfileira um job por e-mail: cada envio
 * roda isolado (em paralelo, com retry da fila) em vez de um loop sequencial.
 */
export async function processDueScheduledEmails(now = new Date()) {
  try {
    const claimed = await claimDueScheduledEmails(now);
    await Promise.all(
      claimed.map(({ id, nextRun }) =>
        enqueue('scheduled-emails.run', {
          scheduledEmailId: id,
          nextRun: nextRun.toISOString(),
        }),
      ),
    );
    logger.info('scheduled_emails.enqueued', { count: claimed.length });
    return { enqueued: claimed.length };
  } catch (error) {
    logger.error('scheduled_emails.process_failed', { error });
    return { enqueued: 0 };
  }
}
