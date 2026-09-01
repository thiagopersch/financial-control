import { formatCurrency } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

/**
 * One `buildXVars` function per entity, each returning a flat object using
 * exactly the keys declared in lib/notification-templates/variable-catalog.ts.
 * Used by BOTH the real automatic triggers (lib/actions/notifications.ts) and
 * the manual test-send action (lib/actions/notification-template-test-send.ts)
 * — single source of truth so preview/test data never drifts from real data.
 *
 * Each `*_VARS_INCLUDE` const is exported so callers build their Prisma query
 * with the exact relations the corresponding builder needs.
 */

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
};

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
};

const CALCULATION_TYPE_LABELS: Record<string, string> = {
  TOTAL_DIVIDED: 'Valor total dividido',
  FIXED_INSTALLMENT: 'Parcela fixa',
};

const FIRST_INSTALLMENT_MONTH_LABELS: Record<string, string> = {
  CURRENT: 'Mês atual',
  NEXT: 'Próximo mês',
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toLocaleDateString('pt-BR');
}

export function buildUserVars(user: { name: string | null }): Record<string, unknown> {
  return { recipientName: user.name || '' };
}

export const TRANSACTION_VARS_INCLUDE = {
  category: true,
  debt: true,
  account: true,
  paymentMethod: true,
  creditCard: { include: { account: true } },
  costCenter: true,
  supplier: true,
} satisfies Prisma.TransactionInclude;

type TransactionWithVarsRelations = Prisma.TransactionGetPayload<{
  include: typeof TRANSACTION_VARS_INCLUDE;
}>;

export function buildTransactionVars(tx: TransactionWithVarsRelations): Record<string, unknown> {
  const amount = Number(tx.amount);
  return {
    // legacy
    transactionId: tx.id,
    name: tx.description || tx.category.name,
    amount,
    dueDate: (tx.dueDate || tx.date).toISOString(),
    isRecurring: tx.isRecurring,
    debtName: tx.debt?.name ?? null,
    // new
    transactionType: TRANSACTION_TYPE_LABELS[tx.type] || tx.type,
    transactionStatus: TRANSACTION_STATUS_LABELS[tx.status] || tx.status,
    transactionAccountName: tx.account?.name ?? '',
    transactionPaymentMethodName: tx.paymentMethod?.name ?? '',
    transactionCreditCardName: tx.creditCard?.account.name ?? '',
    transactionCategoryName: tx.category.name,
    transactionAmount: amount,
    transactionAmountFormatted: formatCurrency(amount),
    transactionDueDate: formatDate(tx.dueDate),
    transactionPaidDate: formatDate(tx.paidAt),
    transactionCostCenterName: tx.costCenter?.name ?? '',
    transactionSupplierName: tx.supplier?.name ?? '',
    transactionNotes: tx.notes ?? '',
    transactionHasDebt: !!tx.debtId,
  };
}

export function buildAccountVars(account: {
  name: string;
  type: string;
  color: string | null;
}): Record<string, unknown> {
  return {
    accountName: account.name,
    accountType: account.type,
    accountColor: account.color ?? '',
  };
}

export const PAYMENT_METHOD_VARS_INCLUDE = {
  accounts: { select: { name: true } },
} satisfies Prisma.PaymentMethodInclude;

type PaymentMethodWithVarsRelations = Prisma.PaymentMethodGetPayload<{
  include: typeof PAYMENT_METHOD_VARS_INCLUDE;
}>;

export function buildPaymentMethodVars(
  pm: PaymentMethodWithVarsRelations,
): Record<string, unknown> {
  return {
    paymentMethodName: pm.name,
    paymentMethodColor: pm.color ?? '',
    paymentMethodIsCreditCard: pm.isCreditCard ? 'Sim' : 'Não',
    paymentMethodAccountNames: pm.accounts.map((a) => a.name).join(', '),
  };
}

export const CREDIT_CARD_VARS_INCLUDE = {
  account: true,
} satisfies Prisma.CreditCardInclude;

type CreditCardWithVarsRelations = Prisma.CreditCardGetPayload<{
  include: typeof CREDIT_CARD_VARS_INCLUDE;
}>;

export function buildCreditCardVars(
  card: CreditCardWithVarsRelations,
  usedAmount: number,
): Record<string, unknown> {
  const limit = Number(card.limit);
  const used = usedAmount;
  const available = Math.max(limit - used, 0);
  return {
    // legacy
    creditCardId: card.id,
    accountId: card.accountId,
    cardName: card.account.name,
    used,
    limit,
    available,
    percentage: limit > 0 ? (used / limit) * 100 : 0,
    // new
    creditCardAccountName: card.account.name,
    creditCardLimit: limit,
    creditCardAvailableLimit: available <= 0 ? 'Sem Limite' : formatCurrency(available),
    creditCardClosingDay: card.closingDay,
    creditCardDueDay: card.dueDay,
    creditCardColor: card.color ?? '',
  };
}

export const DEBT_VARS_INCLUDE = {
  account: true,
  supplier: true,
  category: true,
  paymentMethod: true,
} satisfies Prisma.DebtInclude;

type DebtWithVarsRelations = Prisma.DebtGetPayload<{ include: typeof DEBT_VARS_INCLUDE }>;

export function buildDebtVars(
  debt: DebtWithVarsRelations,
  creditCardName: string | null,
): Record<string, unknown> {
  const initialValue = Number(debt.initialValue);
  const installmentValue = debt.installmentValue ? Number(debt.installmentValue) : null;
  return {
    debtName: debt.name,
    debtAccountName: debt.account?.name ?? '',
    debtSupplierName: debt.supplier?.name ?? '',
    debtCategoryName: debt.category?.name ?? '',
    debtPaymentMethodName: debt.paymentMethod?.name ?? '',
    debtCreditCardName: creditCardName ?? '',
    debtInitialValue: initialValue,
    debtInitialValueFormatted: formatCurrency(initialValue),
    debtCalculationType: debt.calculationType
      ? CALCULATION_TYPE_LABELS[debt.calculationType] || debt.calculationType
      : '',
    debtInstallmentValue: installmentValue ?? '',
    debtInstallmentValueFormatted:
      installmentValue !== null ? formatCurrency(installmentValue) : '',
    debtInstallments: debt.installments ?? '',
    debtFirstInstallmentMonth: debt.firstInstallmentMonth
      ? FIRST_INSTALLMENT_MONTH_LABELS[debt.firstInstallmentMonth] || debt.firstInstallmentMonth
      : '',
    debtDueDay: debt.dueDay ?? '',
    debtDescription: debt.description ?? '',
  };
}

export const BUDGET_VARS_INCLUDE = {
  category: true,
} satisfies Prisma.BudgetInclude;

type BudgetWithVarsRelations = Prisma.BudgetGetPayload<{ include: typeof BUDGET_VARS_INCLUDE }>;

export function buildBudgetVars(budget: BudgetWithVarsRelations): Record<string, unknown> {
  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    budgetAmount: Number(budget.amount),
    budgetCategoryName: budget.category.name,
    budgetAmountFormatted: formatCurrency(Number(budget.amount)),
    budgetMonth: budget.month,
    budgetYear: budget.year,
  };
}

export function buildGoalVars(goal: {
  id: string;
  name: string;
  currentAmount: Prisma.Decimal | number;
  targetAmount: Prisma.Decimal | number;
  deadline: Date | null;
}): Record<string, unknown> {
  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  return {
    goalId: goal.id,
    current,
    target,
    percentage: target > 0 ? (current / target) * 100 : 0,
    goalName: goal.name,
    goalCurrentFormatted: formatCurrency(current),
    goalTargetFormatted: formatCurrency(target),
    goalDeadline: formatDate(goal.deadline),
  };
}
