import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const transactions = await prisma.scheduledTransaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      include: {
        category: true,
      },
      orderBy: {
        nextRun: 'asc',
      },
    });

    const transactionsWithNumbers = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      nextRun: t.nextRun.toISOString(),
    }));

    return NextResponse.json({ transactions: transactionsWithNumbers });
  } catch (error) {
    console.error('Error fetching scheduled:', error);
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, amount, frequency, dayOfMonth, categoryId, nextRun } = body;

    const transaction = await prisma.scheduledTransaction.create({
      data: {
        name,
        type,
        amount,
        frequency,
        dayOfMonth,
        nextRun: new Date(nextRun),
        isActive: true,
        categoryId,
        workspaceId: session.user.workspaceId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        transaction: {
          ...transaction,
          amount: Number(transaction.amount),
          nextRun: transaction.nextRun.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating scheduled:', error);
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
