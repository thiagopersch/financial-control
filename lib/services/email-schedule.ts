import type { EmailScheduleFrequency } from '@prisma/client';

/**
 * Next-run calculation for scheduled e-mails. Dates are computed on the
 * schedule's own timezone calendar (default America/Sao_Paulo), so "every day
 * at 08:00" stays 08:00 local regardless of the server's TZ (Docker = UTC).
 */

export interface EmailScheduleTiming {
  frequency: EmailScheduleFrequency;
  intervalDays?: number | null;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  sendTime: string;
  timezone: string;
}

interface LocalDate {
  year: number;
  month: number; // 1-12
  day: number;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** Converts a wall-clock time in `timeZone` to the matching UTC instant. */
export function zonedTimeToUtc(local: LocalDate, hour: number, minute: number, timeZone: string) {
  const guess = Date.UTC(local.year, local.month - 1, local.day, hour, minute);
  // Offset of the zone at that instant; re-check once to handle DST transitions.
  let result = guess;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(result), timeZone);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    result = guess - (asUtc - result);
  }
  return new Date(result);
}

function toLocalDate(date: Date, timeZone: string): LocalDate {
  const p = zonedParts(date, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

function addLocalDays(d: LocalDate, days: number): LocalDate {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

function weekday(d: LocalDate): number {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthlyDate(year: number, month: number, dayOfMonth: number): LocalDate {
  return { year, month, day: Math.min(dayOfMonth, daysInMonth(year, month)) };
}

export function parseSendTime(sendTime: string): { hour: number; minute: number } {
  const [h, m] = sendTime.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 8, minute: Number.isFinite(m) ? m : 0 };
}

/**
 * First run strictly after `after`. For EVERY_N_DAYS, pass the previous
 * scheduled run as `previous` to keep the cadence anchored (otherwise the
 * first occurrence of `sendTime` after `after` is used).
 */
export function computeNextEmailRun(
  schedule: EmailScheduleTiming,
  after: Date = new Date(),
  previous?: Date | null,
): Date {
  const { hour, minute } = parseSendTime(schedule.sendTime);
  const tz = schedule.timezone || 'America/Sao_Paulo';
  const at = (d: LocalDate) => zonedTimeToUtc(d, hour, minute, tz);
  const today = toLocalDate(after, tz);

  switch (schedule.frequency) {
    case 'DAILY': {
      let d = today;
      while (at(d) <= after) d = addLocalDays(d, 1);
      return at(d);
    }
    case 'EVERY_N_DAYS': {
      const n = Math.max(schedule.intervalDays ?? 1, 1);
      if (previous) {
        let d = addLocalDays(toLocalDate(previous, tz), n);
        while (at(d) <= after) d = addLocalDays(d, n);
        return at(d);
      }
      let d = today;
      while (at(d) <= after) d = addLocalDays(d, 1);
      return at(d);
    }
    case 'WEEKLY': {
      const target = schedule.dayOfWeek ?? 1;
      let d = addLocalDays(today, (target - weekday(today) + 7) % 7);
      while (at(d) <= after) d = addLocalDays(d, 7);
      return at(d);
    }
    case 'MONTHLY': {
      const dom = schedule.dayOfMonth ?? 1;
      let year = today.year;
      let month = today.month;
      let d = monthlyDate(year, month, dom);
      while (at(d) <= after) {
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        d = monthlyDate(year, month, dom);
      }
      return at(d);
    }
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Browser timezone (client) — used as the default for new schedules. */
export function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

/** Formats an instant on the schedule's calendar, e.g. "18/10/2026 às 08:00". */
export function formatInTimeZone(
  date: Date | string,
  timeZone: string,
  options: { weekday?: boolean; time?: boolean } = { time: true },
): string {
  const d = new Date(date);
  const tz = isValidTimeZone(timeZone) ? timeZone : 'America/Sao_Paulo';
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const weekday = options.weekday
    ? `${new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'long' }).format(d)}, `
    : '';
  const time = options.time
    ? ` às ${new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)}`
    : '';
  return `${weekday}${datePart}${time}`;
}

export const WEEKDAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

/** Human-readable cadence, e.g. "Diário às 08:00", "A cada 3 dias às 08:00". */
export function describeEmailSchedule(schedule: EmailScheduleTiming): string {
  const time = `às ${schedule.sendTime}`;
  switch (schedule.frequency) {
    case 'DAILY':
      return `Diário ${time}`;
    case 'EVERY_N_DAYS':
      return `A cada ${schedule.intervalDays ?? 1} dias ${time}`;
    case 'WEEKLY': {
      const dow = schedule.dayOfWeek ?? 1;
      return `${dow === 0 || dow === 6 ? 'Todo' : 'Toda'} ${WEEKDAY_LABELS[dow]} ${time}`;
    }
    case 'MONTHLY':
      return `Todo dia ${schedule.dayOfMonth ?? 1} ${time}`;
  }
}
