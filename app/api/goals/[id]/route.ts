import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const goal = await prisma.goal.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      goal: {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
      },
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Erro ao buscar meta' }, { status: 500 });
  }
}
