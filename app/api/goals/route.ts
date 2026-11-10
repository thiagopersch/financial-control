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
      prisma.goal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.goal.count({ where }),
    ]);

    return NextResponse.json({
      goals: items.map((g) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
      })),
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
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
    const { name, targetAmount, currentAmount, deadline, color } = body;

    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        deadline: deadline ? new Date(deadline) : null,
        color: color || '#0ea5e9',
        isActive: true,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(
      {
        goal: {
          ...goal,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 });
  }
}
