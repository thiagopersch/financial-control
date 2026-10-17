import { DEFAULT_REPORT_TEMPLATES } from '@/lib/notification-templates/default-report-templates';
import {
  applyConditionals,
  interpolate,
  stripHtml,
} from '@/lib/notification-templates/interpolate';
import { renderBlockTreeToHtml, resolveEmailBodyHtml } from '@/lib/notification-templates/render';
import prisma from '@/lib/prisma';
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
 * Sends every active schedule whose nextRun is due. Each schedule is claimed
 * atomically (compare-and-set on nextRun) before sending, so concurrent cron
 * calls / dashboard `after()` hooks never send the same occurrence twice.
 */
export async function processDueScheduledEmails(now = new Date()) {
  const summary = { processed: 0, sent: 0, skipped: 0, failed: 0 };
  try {
    const due = await prisma.scheduledEmail.findMany({
      where: { isActive: true, nextRun: { lte: now } },
      include: { template: true },
      orderBy: { nextRun: 'asc' },
      take: 100,
    });

    for (const schedule of due) {
      const nextRun = computeNextEmailRun(schedule, now, schedule.nextRun);
      const claimed = await prisma.scheduledEmail.updateMany({
        where: { id: schedule.id, nextRun: schedule.nextRun, isActive: true },
        data: { nextRun },
      });
      if (claimed.count === 0) continue;

      summary.processed++;
      const result = await runScheduledEmail(schedule);
      if (result.status === 'SENT') summary.sent++;
      else if (result.status === 'SKIPPED') summary.skipped++;
      else summary.failed++;

      await createSystemAuditLog({
        workspaceId: schedule.workspaceId,
        userId: schedule.createdById,
        action: 'RUN_SCHEDULED_EMAIL',
        entity: 'ScheduledEmail',
        entityId: schedule.id,
        newValue: { status: result.status, error: result.error, nextRun },
      });
    }
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
  }
  console.info(JSON.stringify({ event: 'scheduled_emails_processed', ...summary }));
  return summary;
}
