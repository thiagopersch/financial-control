import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1;
    const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        month,
        year,
      },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            workspaceId: session.user.workspaceId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            status: 'PAID',
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        const spentAmount = Number(spent._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
        const remaining = budgetAmount - spentAmount;

        let status: 'safe' | 'warning' | 'exceeded' = 'safe';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= 80) status = 'warning';

        return {
          ...budget,
          amount: budgetAmount,
          spentAmount,
          remaining,
          percentage,
          status,
          category: budget.category
            ? { id: budget.category.id, name: budget.category.name, color: budget.category.color }
            : null,
        };
      }),
    );

    return NextResponse.json({ budgets: budgetsWithSpent });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, amount, month, year, alertAt80, alertAt100 } = body;

    const existing = await prisma.budget.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        categoryId,
        month,
        year,
      },
    });

    let budget;
    if (existing) {
      budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount, alertAt80, alertAt100 },
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          categoryId,
          amount,
          month,
          year,
          alertAt80: alertAt80 ?? true,
          alertAt100: alertAt100 ?? true,
          workspaceId: session.user.workspaceId,
        },
      });
    }

    return NextResponse.json(
      { budget: { ...budget, amount: Number(budget.amount) } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Erro ao criar orçamento' }, { status: 500 });
  }
}
