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
    const debt = await prisma.debt.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!debt) {
      return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      debt: {
        ...debt,
        initialValue: Number(debt.initialValue),
        currentValue: Number(debt.currentValue),
        interestRate: debt.interestRate ? Number(debt.interestRate) : null,
        minimumPayment: Number(debt.minimumPayment),
        startDate: debt.startDate.toISOString(),
        endDate: debt.endDate?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Error fetching debt:', error);
    return NextResponse.json({ error: 'Erro ao buscar dívida' }, { status: 500 });
  }
}
