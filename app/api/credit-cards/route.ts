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

    const creditCards = await prisma.creditCard.findMany({
      where: {
        account: {
          workspaceId: session.user.workspaceId,
        },
      },
      include: {
        account: true,
        invoices: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 6,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const creditCardsWithStats = creditCards.map((card) => {
      const availableLimit = Number(card.limit) - Number(card.usedAmount);
      const usagePercentage =
        Number(card.limit) > 0 ? (Number(card.usedAmount) / Number(card.limit)) * 100 : 0;

      return {
        ...card,
        limit: Number(card.limit),
        initialBalance: Number(card.initialBalance),
        usedAmount: Number(card.usedAmount),
        availableLimit,
        usagePercentage,
        account: {
          id: card.account.id,
          name: card.account.name,
          type: card.account.type,
          color: card.account.color,
        },
      };
    });

    return NextResponse.json({ creditCards: creditCardsWithStats });
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return NextResponse.json({ error: 'Erro ao buscar cartões de crédito' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, limit, initialBalance, closingDay, dueDay, accountId, color } = body;

    // If accountId is provided, verify it exists and belongs to the workspace
    if (accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account || account.workspaceId !== session.user.workspaceId) {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 400 });
      }

      // Update account name if provided
      if (name) {
        await prisma.account.update({
          where: { id: accountId },
          data: { name },
        });
      }
    }

    const creditCard = await prisma.creditCard.create({
      data: {
        limit,
        initialBalance: initialBalance || 0,
        closingDay,
        dueDay,
        color: color || '#6366f1',
        accountId,
      },
      include: {
        account: true,
      },
    });

    const formattedCreditCard = {
      ...creditCard,
      limit: Number(creditCard.limit),
      initialBalance: Number(creditCard.initialBalance),
      usedAmount: Number(creditCard.usedAmount),
      account: {
        id: creditCard.account.id,
        name: creditCard.account.name,
        type: creditCard.account.type,
        color: creditCard.account.color,
      },
    };

    return NextResponse.json({ creditCard: formattedCreditCard }, { status: 201 });
  } catch (error) {
    console.error('Error creating credit card:', error);
    return NextResponse.json({ error: 'Erro ao criar cartão de crédito' }, { status: 500 });
  }
}
