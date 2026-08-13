import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getBudgetsFiltered } from '@/lib/queries/budgets';

const ALLOWED_PAGE_SIZES = [10, 20, 50, 100];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1;
    const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear();
    const q = searchParams.get('q')?.trim() || undefined;
    const category = searchParams.get('category') || undefined;
    const pageSizeParam = Number(searchParams.get('pageSize'));
    const pageSize = ALLOWED_PAGE_SIZES.includes(pageSizeParam) ? pageSizeParam : 10;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const { budgets, totalCount } = await getBudgetsFiltered({
      workspaceId: session.user.workspaceId,
      month,
      year,
      q,
      category,
      page,
      pageSize,
    });

    return NextResponse.json({ budgets, totalCount, page, pageSize });
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
