import { computeNextEmailRun, describeEmailSchedule } from '@/lib/services/email-schedule';
import { describe, expect, it } from 'vitest';

const TZ = 'America/Sao_Paulo'; // UTC-3, sem horário de verão
const base = { sendTime: '08:00', timezone: TZ };

describe('computeNextEmailRun', () => {
  it('DAILY: hoje se o horário ainda não passou, senão amanhã', () => {
    const before = new Date('2026-10-17T10:00:00Z'); // 07:00 local
    expect(computeNextEmailRun({ ...base, frequency: 'DAILY' }, before).toISOString()).toBe(
      '2026-10-17T11:00:00.000Z',
    );
    const after = new Date('2026-10-17T11:00:00Z'); // exatamente 08:00 local
    expect(computeNextEmailRun({ ...base, frequency: 'DAILY' }, after).toISOString()).toBe(
      '2026-10-18T11:00:00.000Z',
    );
  });

  it('usa o calendário do fuso, não o UTC do servidor', () => {
    // 02:00 UTC do dia 18 ainda é 23:00 do dia 17 em São Paulo
    const now = new Date('2026-10-18T02:00:00Z');
    expect(computeNextEmailRun({ ...base, frequency: 'DAILY' }, now).toISOString()).toBe(
      '2026-10-18T11:00:00.000Z',
    );
  });

  it('EVERY_N_DAYS mantém a cadência a partir do envio anterior', () => {
    const previous = new Date('2026-10-14T11:00:00Z');
    const now = new Date('2026-10-17T11:00:00Z');
    const next = computeNextEmailRun(
      { ...base, frequency: 'EVERY_N_DAYS', intervalDays: 3 },
      now,
      previous,
    );
    expect(next.toISOString()).toBe('2026-10-20T11:00:00.000Z');
  });

  it('EVERY_N_DAYS pula ocorrências perdidas sem enviar em rajada', () => {
    const previous = new Date('2026-10-01T11:00:00Z');
    const now = new Date('2026-10-17T12:00:00Z');
    const next = computeNextEmailRun(
      { ...base, frequency: 'EVERY_N_DAYS', intervalDays: 5 },
      now,
      previous,
    );
    expect(next.toISOString()).toBe('2026-10-21T11:00:00.000Z');
  });

  it('WEEKLY vai para o próximo dia da semana configurado', () => {
    const saturday = new Date('2026-10-17T12:00:00Z');
    const next = computeNextEmailRun({ ...base, frequency: 'WEEKLY', dayOfWeek: 1 }, saturday);
    expect(next.toISOString()).toBe('2026-10-19T11:00:00.000Z'); // segunda
  });

  it('WEEKLY no próprio dia após o horário vai para a semana seguinte', () => {
    const mondayLate = new Date('2026-10-19T15:00:00Z');
    const next = computeNextEmailRun({ ...base, frequency: 'WEEKLY', dayOfWeek: 1 }, mondayLate);
    expect(next.toISOString()).toBe('2026-10-26T11:00:00.000Z');
  });

  it('MONTHLY com dia 31 usa o último dia de meses curtos', () => {
    const jan31Late = new Date('2027-01-31T15:00:00Z');
    const next = computeNextEmailRun({ ...base, frequency: 'MONTHLY', dayOfMonth: 31 }, jan31Late);
    expect(next.toISOString()).toBe('2027-02-28T11:00:00.000Z');
  });

  it('MONTHLY vira o ano', () => {
    const dec = new Date('2026-12-20T12:00:00Z');
    const next = computeNextEmailRun({ ...base, frequency: 'MONTHLY', dayOfMonth: 5 }, dec);
    expect(next.toISOString()).toBe('2027-01-05T11:00:00.000Z');
  });
});

describe('describeEmailSchedule', () => {
  it('gera rótulos legíveis', () => {
    expect(describeEmailSchedule({ ...base, frequency: 'DAILY' })).toBe('Diário às 08:00');
    expect(describeEmailSchedule({ ...base, frequency: 'EVERY_N_DAYS', intervalDays: 3 })).toBe(
      'A cada 3 dias às 08:00',
    );
    expect(describeEmailSchedule({ ...base, frequency: 'WEEKLY', dayOfWeek: 0 })).toBe(
      'Todo domingo às 08:00',
    );
    expect(describeEmailSchedule({ ...base, frequency: 'WEEKLY', dayOfWeek: 1 })).toBe(
      'Toda segunda-feira às 08:00',
    );
  });
});
