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

    const [items, total] = await Promise.all([
      prisma.debt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.debt.count({ where }),
    ]);

    return NextResponse.json({
      debts: items.map((d) => ({
        ...d,
        initialValue: Number(d.initialValue),
        currentValue: Number(d.currentValue),
        interestRate: d.interestRate ? Number(d.interestRate) : null,
        minimumPayment: Number(d.minimumPayment),
        startDate: d.startDate.toISOString(),
        endDate: d.endDate?.toISOString() || null,
      })),
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      initialValue,
      currentValue,
      interestRate,
      minimumPayment,
      dueDay,
      startDate,
      installments,
      accountId,
    } = body;

    const debt = await prisma.debt.create({
      data: {
        name,
        description,
        initialValue,
        currentValue: currentValue || initialValue,
        interestRate,
        minimumPayment,
        dueDay,
        startDate: new Date(startDate),
        installments,
        status: 'ACTIVE',
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(
      {
        debt: {
          ...debt,
          initialValue: Number(debt.initialValue),
          currentValue: Number(debt.currentValue),
          interestRate: debt.interestRate ? Number(debt.interestRate) : null,
          minimumPayment: Number(debt.minimumPayment),
          startDate: debt.startDate.toISOString(),
          endDate: debt.endDate?.toISOString() || null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json({ error: 'Erro ao criar dívida' }, { status: 500 });
  }
}
