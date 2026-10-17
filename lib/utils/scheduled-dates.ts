/** Limita `day` ao último dia do mês (`monthIndex` 0–11), ex.: 31 em fevereiro → 28/29. */
export function clampDayToMonth(year: number, monthIndex: number, day: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(day, 1), lastDay);
}

/** Mesma data/hora de `date`, trocando apenas o dia do mês (com clamp ao tamanho do mês). */
export function shiftToDayOfMonth(date: Date, day: number): Date {
  const shifted = new Date(date);
  shifted.setDate(1);
  shifted.setDate(clampDayToMonth(shifted.getFullYear(), shifted.getMonth(), day));
  return shifted;
}

/**
 * Vencimento da transação gerada por um agendamento: o `dueDay` no mesmo mês/ano
 * da ocorrência. Sem `dueDay`, vence na própria data de execução.
 */
export function computeScheduledDueDate(occurrence: Date, dueDay: number | null): Date {
  if (!dueDay) return new Date(occurrence);
  return shiftToDayOfMonth(occurrence, dueDay);
}
