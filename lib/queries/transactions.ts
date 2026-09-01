import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

export type DebtTransactionDTO = {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  status: TransactionStatus;
  categoryName: string | null;
  categoryColor: string | null;
};

export async function getTransactionsByDebtId(debtId: string): Promise<DebtTransactionDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: { debtId, workspaceId: session.user.workspaceId },
      include: { category: { select: { name: true, color: true } } },
      orderBy: { date: 'asc' },
    });

    return transactions.map((t) => ({
      id: t.id,
      description: t.description,
      date: t.date.toISOString(),
      amount: Number(t.amount),
      status: t.status,
      categoryName: t.category?.name ?? null,
      categoryColor: t.category?.color ?? null,
    }));
  } catch (error) {
    console.error('Error fetching transactions by debt:', error);
    return [];
  }
}
