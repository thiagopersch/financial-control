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

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id,
        account: {
          workspaceId: session.user.workspaceId,
        },
      },
      include: {
        account: true,
        invoices: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });

    if (!creditCard) {
      return NextResponse.json({ error: 'Cartão de crédito não encontrado' }, { status: 404 });
    }

    const availableLimit = Number(creditCard.limit) - Number(creditCard.usedAmount);
    const usagePercentage =
      Number(creditCard.limit) > 0
        ? (Number(creditCard.usedAmount) / Number(creditCard.limit)) * 100
        : 0;

    const formattedCreditCard = {
      ...creditCard,
      limit: Number(creditCard.limit),
      initialBalance: Number(creditCard.initialBalance),
      usedAmount: Number(creditCard.usedAmount),
      availableLimit,
      usagePercentage,
      account: {
        id: creditCard.account.id,
        name: creditCard.account.name,
        type: creditCard.account.type,
        color: creditCard.account.color,
      },
    };

    return NextResponse.json({ creditCard: formattedCreditCard });
  } catch (error) {
    console.error('Error fetching credit card:', error);
    return NextResponse.json({ error: 'Erro ao buscar cartão de crédito' }, { status: 500 });
  }
}
