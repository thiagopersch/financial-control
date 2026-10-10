type DebtValues = { initialValue: number; currentValue: number };

/**
 * Progresso exibido de uma dívida. Os valores vêm do recálculo a partir das
 * parcelas (`recalculateDebtTotals`); ainda assim os limites protegem a UI de
 * dados inconsistentes (ex.: pago acima do total → nunca mais de 100%).
 */
export function getDebtProgress({ initialValue, currentValue }: DebtValues) {
  const remaining = Math.max(currentValue, 0);
  const paid = Math.max(initialValue - currentValue, 0);
  const percentage = initialValue > 0 ? Math.min(Math.max((paid / initialValue) * 100, 0), 100) : 0;

  return { paid, remaining, percentage };
}
