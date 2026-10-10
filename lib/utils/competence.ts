/**
 * Competência = mês/ano a que a transação pertence. É armazenada em uma coluna
 * `@db.Date` como o 1º dia do mês em UTC (ex.: 2026-10-01T00:00:00.000Z), então
 * toda leitura usa getters UTC e toda escrita monta a data via `Date.UTC`.
 */

const YEAR_MONTH_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** 1º dia (UTC) do mês/ano informados. `month` é 1-12. */
export function competenceFromYearMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Competência a partir de uma data "real" (usa o ano/mês local da data). */
export function toCompetence(date: Date | string) {
  const d = new Date(date);
  return competenceFromYearMonth(d.getFullYear(), d.getMonth() + 1);
}

/** Soma meses a uma competência, mantendo o dia 1 em UTC. */
export function addCompetenceMonths(competence: Date | string, months: number) {
  const d = new Date(competence);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
}

/** `YYYY-MM` de uma data "real" (ano/mês local) — usado pelo formulário. */
export function toYearMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** `YYYY-MM` de uma competência armazenada (getters UTC). */
export function competenceToYearMonthString(competence: Date | string) {
  const d = new Date(competence);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isYearMonthString(value: string) {
  return YEAR_MONTH_REGEX.test(value);
}

export function parseYearMonthString(value: string) {
  const match = YEAR_MONTH_REGEX.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** Converte `YYYY-MM` na competência (1º dia em UTC). */
export function competenceFromYearMonthString(value: string) {
  const parsed = parseYearMonthString(value);
  if (!parsed) throw new Error(`Competência inválida: ${value}`);
  return competenceFromYearMonth(parsed.year, parsed.month);
}

/** `MM/YYYY` de uma competência armazenada. */
export function formatCompetence(competence: Date | string) {
  const d = new Date(competence);
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

export function isSameCompetence(a: Date | string, b: Date | string) {
  return new Date(a).getTime() === new Date(b).getTime();
}

/**
 * Intervalo `{ gte, lte }` para filtrar a coluna `competence`.
 * - `month` 1-12 → só aquele mês
 * - sem `month` → o ano inteiro
 */
export function competenceRange(year: number, month?: number) {
  if (month) {
    const date = competenceFromYearMonth(year, month);
    return { gte: date, lte: date };
  }
  return { gte: competenceFromYearMonth(year, 1), lte: competenceFromYearMonth(year, 12) };
}

/**
 * Converte os search params globais de período (`year`/`month`, padrão do
 * MonthSelector) no filtro de competência. `undefined` = sem filtro (todos os períodos).
 */
export function competenceRangeFromPeriodParams(
  yearParam?: string | null,
  monthParam?: string | null,
  now = new Date(),
) {
  if (yearParam === 'all') return undefined;

  const year = Number(yearParam);
  if (!yearParam || Number.isNaN(year)) {
    return competenceRange(now.getFullYear(), now.getMonth() + 1);
  }

  if (monthParam === 'all') return competenceRange(year);

  const month = Number(monthParam);
  if (monthParam && month >= 1 && month <= 12) return competenceRange(year, month);

  return competenceRange(now.getFullYear(), now.getMonth() + 1);
}
