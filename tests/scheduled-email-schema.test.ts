import { SCHEDULED_EMAIL_DEFAULTS, scheduledEmailSchema } from '@/lib/schemas/scheduled-email';
import { describe, expect, it } from 'vitest';

const valid = { ...SCHEDULED_EMAIL_DEFAULTS, name: 'Lembrete', toEmails: ['eu@exemplo.com'] };

describe('scheduledEmailSchema', () => {
  it('aceita um agendamento válido e normaliza e-mails', () => {
    const parsed = scheduledEmailSchema.parse({ ...valid, ccEmails: [' Contador@Exemplo.com '] });
    expect(parsed.ccEmails).toEqual(['contador@exemplo.com']);
  });

  it('exige ao menos um destinatário em Para', () => {
    expect(scheduledEmailSchema.safeParse({ ...valid, toEmails: [] }).success).toBe(false);
  });

  it('rejeita e-mail inválido e duplicados', () => {
    expect(scheduledEmailSchema.safeParse({ ...valid, toEmails: ['nao-e-email'] }).success).toBe(
      false,
    );
    expect(
      scheduledEmailSchema.safeParse({ ...valid, toEmails: ['a@b.com', 'a@b.com'] }).success,
    ).toBe(false);
  });

  it('rejeita o mesmo e-mail em Para e Cópia', () => {
    const r = scheduledEmailSchema.safeParse({ ...valid, ccEmails: ['eu@exemplo.com'] });
    expect(r.success).toBe(false);
  });

  it('exige campos condicionais por frequência', () => {
    expect(
      scheduledEmailSchema.safeParse({ ...valid, frequency: 'EVERY_N_DAYS', intervalDays: null })
        .success,
    ).toBe(false);
    expect(
      scheduledEmailSchema.safeParse({ ...valid, frequency: 'WEEKLY', dayOfWeek: null }).success,
    ).toBe(false);
    expect(
      scheduledEmailSchema.safeParse({ ...valid, frequency: 'MONTHLY', dayOfMonth: null }).success,
    ).toBe(false);
  });

  it('exige ao menos um conteúdo no lembrete de pendências', () => {
    const r = scheduledEmailSchema.safeParse({
      ...valid,
      includeOverdueTransactions: false,
      includeOverdueInstallments: false,
      includeOpenDebts: false,
    });
    expect(r.success).toBe(false);
  });

  it('rejeita horário inválido', () => {
    expect(scheduledEmailSchema.safeParse({ ...valid, sendTime: '25:00' }).success).toBe(false);
  });
});
