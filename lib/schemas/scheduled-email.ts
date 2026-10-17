import { isValidTimeZone } from '@/lib/services/email-schedule';
import * as z from 'zod';

/** Single schema for the scheduled e-mail form (client) and actions (server). */

export const EMAIL_REPORT_TYPES = ['PENDING_ITEMS_DIGEST', 'EXPENSE_SUMMARY'] as const;
export const EMAIL_SCHEDULE_FREQUENCIES = ['DAILY', 'WEEKLY', 'EVERY_N_DAYS', 'MONTHLY'] as const;

export const MAX_RECIPIENTS = 20;

const emailList = (label: string, min: number) =>
  z
    .array(z.string().trim().toLowerCase().email(`E-mail inválido em ${label}`))
    .min(min, `Informe ao menos ${min} e-mail em ${label}`)
    .max(MAX_RECIPIENTS, `Máximo de ${MAX_RECIPIENTS} e-mails em ${label}`)
    .refine((list) => new Set(list).size === list.length, `E-mails repetidos em ${label}`);

export const scheduledEmailSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório').max(120),
    reportType: z.enum(EMAIL_REPORT_TYPES),
    templateId: z.string().nullable(),
    frequency: z.enum(EMAIL_SCHEDULE_FREQUENCIES),
    intervalDays: z
      .number()
      .int()
      .min(2, 'Mínimo de 2 dias')
      .max(90, 'Máximo de 90 dias')
      .nullable(),
    dayOfWeek: z.number().int().min(0).max(6).nullable(),
    dayOfMonth: z.number().int().min(1, 'Dia entre 1 e 31').max(31, 'Dia entre 1 e 31').nullable(),
    timezone: z.string().refine(isValidTimeZone, 'Fuso horário inválido'),
    sendTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (HH:mm)'),
    toEmails: emailList('Para', 1),
    ccEmails: emailList('Cópia', 0),
    includeOverdueTransactions: z.boolean(),
    includeOverdueInstallments: z.boolean(),
    includeOpenDebts: z.boolean(),
    skipIfEmpty: z.boolean(),
    summaryPeriodDays: z.number().int().min(1).max(31),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === 'EVERY_N_DAYS' && data.intervalDays == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['intervalDays'],
        message: 'Informe o intervalo em dias',
      });
    }
    if (data.frequency === 'WEEKLY' && data.dayOfWeek == null) {
      ctx.addIssue({ code: 'custom', path: ['dayOfWeek'], message: 'Selecione o dia da semana' });
    }
    if (data.frequency === 'MONTHLY' && data.dayOfMonth == null) {
      ctx.addIssue({ code: 'custom', path: ['dayOfMonth'], message: 'Informe o dia do mês' });
    }
    if (
      data.reportType === 'PENDING_ITEMS_DIGEST' &&
      !data.includeOverdueTransactions &&
      !data.includeOverdueInstallments &&
      !data.includeOpenDebts
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['includeOverdueTransactions'],
        message: 'Selecione ao menos um conteúdo para o lembrete',
      });
    }
    const overlap = data.ccEmails.filter((e) => data.toEmails.includes(e));
    if (overlap.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['ccEmails'],
        message: `Já está em "Para": ${overlap.join(', ')}`,
      });
    }
  });

export type ScheduledEmailInput = z.infer<typeof scheduledEmailSchema>;

export const SCHEDULED_EMAIL_DEFAULTS: ScheduledEmailInput = {
  name: '',
  reportType: 'PENDING_ITEMS_DIGEST',
  templateId: null,
  frequency: 'DAILY',
  intervalDays: 3,
  dayOfWeek: 1,
  dayOfMonth: 1,
  sendTime: '08:00',
  timezone: 'America/Sao_Paulo',
  toEmails: [],
  ccEmails: [],
  includeOverdueTransactions: true,
  includeOverdueInstallments: true,
  includeOpenDebts: false,
  skipIfEmpty: true,
  summaryPeriodDays: 7,
};
