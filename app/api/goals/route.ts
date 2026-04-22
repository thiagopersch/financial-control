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

    const goals = await prisma.goal.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      goals: goals.map((g) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
      })),
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
