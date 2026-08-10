import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { CalculationType, FirstInstallmentMonth, TransactionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

export type DebtDTO = {
  id: string;
  name: string;
  description: string | null;
  initialValue: number;
  currentValue: number;
  interestRate: number | null;
  minimumPayment: number;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  installments: number | null;
  calculationType: CalculationType | null;
  installmentValue: number | null;
  firstInstallmentMonth: FirstInstallmentMonth | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  accountId: string | null;
  accountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  creditCardId: string | null;
  remainingInstallments: number | null;
};

const debtInclude = {
  account: { select: { name: true } },
  category: { select: { name: true } },
  supplier: { select: { name: true } },
  paymentMethod: { select: { name: true } },
  transactions: { select: { status: true } },
} as const;

function mapDebt(debt: {
  id: string;
  name: string;
  description: string | null;
  initialValue: unknown;
  currentValue: unknown;
  interestRate: unknown;
  minimumPayment: unknown;
  dueDay: number | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  installments: number | null;
  calculationType: CalculationType | null;
  installmentValue: unknown;
  firstInstallmentMonth: FirstInstallmentMonth | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  accountId: string | null;
  account: { name: string } | null;
  categoryId: string | null;
  category: { name: string } | null;
  supplierId: string | null;
  supplier: { name: string } | null;
  paymentMethodId: string | null;
  paymentMethod: { name: string } | null;
  creditCardId: string | null;
  transactions: { status: TransactionStatus }[];
}): DebtDTO {
  const paidCount = debt.transactions.filter((t) => t.status === TransactionStatus.PAID).length;
  const remainingInstallments =
    debt.installments != null ? Math.max(debt.installments - paidCount, 0) : null;

  return {
    id: debt.id,
    name: debt.name,
    description: debt.description,
    initialValue: Number(debt.initialValue),
    currentValue: Number(debt.currentValue),
    interestRate: debt.interestRate != null ? Number(debt.interestRate) : null,
    minimumPayment: Number(debt.minimumPayment),
    dueDay: debt.dueDay,
    startDate: debt.startDate.toISOString(),
    endDate: debt.endDate?.toISOString() || null,
    isActive: debt.isActive,
    installments: debt.installments,
    calculationType: debt.calculationType,
    installmentValue: debt.installmentValue != null ? Number(debt.installmentValue) : null,
    firstInstallmentMonth: debt.firstInstallmentMonth,
    workspaceId: debt.workspaceId,
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
    accountId: debt.accountId,
    accountName: debt.account?.name ?? null,
    categoryId: debt.categoryId,
    categoryName: debt.category?.name ?? null,
    supplierId: debt.supplierId,
    supplierName: debt.supplier?.name ?? null,
    paymentMethodId: debt.paymentMethodId,
    paymentMethodName: debt.paymentMethod?.name ?? null,
    creditCardId: debt.creditCardId,
    remainingInstallments,
  };
}

export async function getDebts(): Promise<DebtDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const debts = await prisma.debt.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      include: debtInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return debts
      .map(mapDebt)
      .sort((a, b) => (a.remainingInstallments ?? Infinity) - (b.remainingInstallments ?? Infinity));
  } catch (error) {
    console.error('Error fetching debts:', error);
    return [];
  }
}

export async function getDebtById(id: string): Promise<DebtDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const debt = await prisma.debt.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      include: debtInclude,
    });

    if (!debt) return null;

    return mapDebt(debt);
  } catch (error) {
    console.error('Error fetching debt:', error);
    return null;
  }
}
