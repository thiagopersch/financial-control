/**
 * Mesma data/hora no mês corrente, com o dia limitado ao último dia do mês
 * (ex.: 31/01 vira 30/04). Usado ao mover transações vencidas para o mês atual.
 */
export function moveDateToCurrentMonth(original: Date, now: Date): Date {
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(original.getDate(), daysInCurrentMonth);
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    clampedDay,
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
  );
}
