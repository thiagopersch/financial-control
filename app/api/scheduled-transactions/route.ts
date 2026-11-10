import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { paginationMeta, parsePagination } from '@/lib/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { page, pageSize, skip, take, q } = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 100,
    });
    const where = {
      workspaceId: session.user.workspaceId,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.scheduledTransaction.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true, type: true } },
          supplier: { select: { id: true, name: true } },
          _count: { select: { transactions: true } },
        },
        orderBy: { nextRun: 'asc' },
        skip,
        take,
      }),
      prisma.scheduledTransaction.count({ where }),
    ]);

    const transactionsWithNumbers = transactions.map(({ _count, ...t }) => ({
      ...t,
      amount: Number(t.amount),
      nextRun: t.nextRun.toISOString(),
      lastRun: t.lastRun?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      generatedCount: _count.transactions,
    }));

    return NextResponse.json({
      transactions: transactionsWithNumbers,
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching scheduled:', error);
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
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
