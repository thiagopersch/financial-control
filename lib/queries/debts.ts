import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
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
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  accountId?: string;
};

export async function getDebts(): Promise<DebtDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const debts = await prisma.debt.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return debts.map((debt) => ({
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
      workspaceId: debt.workspaceId,
      createdAt: debt.createdAt.toISOString(),
      updatedAt: debt.updatedAt.toISOString(),
    }));
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
    });

    if (!debt) return null;

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
      workspaceId: debt.workspaceId,
      createdAt: debt.createdAt.toISOString(),
      updatedAt: debt.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching debt:', error);
    return null;
  }
}
