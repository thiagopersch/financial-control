import prisma from '@/lib/prisma';
import { describeEmailSchedule } from '@/lib/services/email-schedule';
import type {
  EmailDeliveryStatus,
  EmailReportType,
  EmailScheduleFrequency,
  Prisma,
} from '@prisma/client';

const LIST_INCLUDE = {
  template: { select: { id: true, name: true } },
  logs: { orderBy: { sentAt: 'desc' }, take: 1 },
} satisfies Prisma.ScheduledEmailInclude;

type ScheduledEmailRow = Prisma.ScheduledEmailGetPayload<{ include: typeof LIST_INCLUDE }>;

export interface ScheduledEmailDTO {
  id: string;
  name: string;
  reportType: EmailReportType;
  templateId: string | null;
  templateName: string | null;
  frequency: EmailScheduleFrequency;
  intervalDays: number | null;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  sendTime: string;
  timezone: string;
  toEmails: string[];
  ccEmails: string[];
  includeOverdueTransactions: boolean;
  includeOverdueInstallments: boolean;
  includeOpenDebts: boolean;
  skipIfEmpty: boolean;
  summaryPeriodDays: number;
  nextRun: string;
  lastRun: string | null;
  isActive: boolean;
  scheduleLabel: string;
  lastStatus: EmailDeliveryStatus | null;
  lastError: string | null;
}

export interface ScheduledEmailLogDTO {
  id: string;
  status: EmailDeliveryStatus;
  recipients: string[];
  subject: string;
  error: string | null;
  itemsCount: number;
  manual: boolean;
  sentAt: string;
}

function toDTO(row: ScheduledEmailRow): ScheduledEmailDTO {
  const {
    template,
    logs,
    workspaceId: _w,
    createdById: _c,
    createdAt: _ca,
    updatedAt: _u,
    ...rest
  } = row;
  return {
    ...rest,
    templateName: template?.name ?? null,
    nextRun: row.nextRun.toISOString(),
    lastRun: row.lastRun?.toISOString() ?? null,
    scheduleLabel: describeEmailSchedule(row),
    lastStatus: logs[0]?.status ?? null,
    lastError: logs[0]?.error ?? null,
  };
}

export async function listScheduledEmails(
  workspaceId: string,
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
) {
  const where = { workspaceId };
  const [rows, total] = await Promise.all([
    prisma.scheduledEmail.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: [{ isActive: 'desc' }, { nextRun: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scheduledEmail.count({ where }),
  ]);
  return { items: rows.map(toDTO), total, page, pageSize };
}

export function getScheduledEmail(workspaceId: string, id: string) {
  return prisma.scheduledEmail.findFirst({
    where: { id, workspaceId },
    include: { template: true },
  });
}

export async function listScheduledEmailLogs(
  workspaceId: string,
  scheduledEmailId: string,
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
) {
  const where = { scheduledEmailId, scheduledEmail: { workspaceId } };
  const [rows, total] = await Promise.all([
    prisma.scheduledEmailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scheduledEmailLog.count({ where }),
  ]);
  return {
    items: rows.map<ScheduledEmailLogDTO>((l) => ({
      id: l.id,
      status: l.status,
      recipients: l.recipients,
      subject: l.subject,
      error: l.error,
      itemsCount: l.itemsCount,
      manual: l.manual,
      sentAt: l.sentAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}
