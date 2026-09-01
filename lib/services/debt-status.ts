import { DebtStatus } from '@prisma/client';

/**
 * Keeps the ACTIVE/PAID auto-toggle that used to live on `isActive` (flips as the
 * remaining balance crosses zero), but leaves manually-set statuses (CANCELLED,
 * RENEGOTIATED, SUSPENDED) untouched so a background balance sync never silently
 * reactivates a debt the user deliberately moved out of the normal payment flow.
 */
export function resolveDebtStatusFromBalance(
  currentStatus: DebtStatus,
  newCurrentValue: number,
): DebtStatus {
  if (currentStatus !== 'ACTIVE' && currentStatus !== 'PAID') {
    return currentStatus;
  }
  return newCurrentValue > 0 ? 'ACTIVE' : 'PAID';
}
