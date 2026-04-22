import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const budget = await prisma.budget.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
      include: { category: true },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      budget: {
        ...budget,
        amount: Number(budget.amount),
        category: budget.category
          ? { id: budget.category.id, name: budget.category.name, color: budget.category.color }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 });
  }
}
