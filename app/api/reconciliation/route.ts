import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const bankTransactions = await prisma.bankTransaction.findMany({
      where: {
        bankAccount: { workspaceId: session.user.workspaceId },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const transactions = bankTransactions.map((tx) => ({
      id: tx.id,
      date: tx.date.toISOString(),
      description: tx.description,
      amount: Number(tx.amount),
      type: tx.type,
      status: tx.status,
      matched: tx.status === 'MATCHED',
    }));

    const stats = {
      total: transactions.length,
      matched: transactions.filter((t) => t.status === 'MATCHED').length,
      pending: transactions.filter((t) => t.status === 'PENDING' || t.status === 'UNMATCHED')
        .length,
      disputed: transactions.filter((t) => t.status === 'DISPUTED').length,
    };

    return NextResponse.json({ transactions, stats });
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
