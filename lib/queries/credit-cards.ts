import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export type CreditCardDTO = {
  id: string;
  accountId: string;
  limit: number;
  initialBalance: number;
  usedAmount: number;
  closingDay: number;
  dueDay: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    type: string;
    color: string | null;
  };
  availableLimit: number;
  usagePercentage: number;
};

export async function getCreditCards(): Promise<CreditCardDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const creditCards = await prisma.creditCard.findMany({
      where: {
        account: {
          workspaceId: session.user.workspaceId,
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return creditCards.map((card) => {
      const availableLimit = Number(card.limit) - Number(card.usedAmount);
      const usagePercentage =
        Number(card.limit) > 0 ? (Number(card.usedAmount) / Number(card.limit)) * 100 : 0;

      return {
        id: card.id,
        accountId: card.accountId,
        limit: Number(card.limit),
        initialBalance: Number(card.initialBalance),
        usedAmount: Number(card.usedAmount),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        color: card.color || '#6366f1',
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
        account: {
          id: card.account.id,
          name: card.account.name,
          type: card.account.type,
          color: card.account.color || '#000000',
        },
        availableLimit,
        usagePercentage,
      };
    });
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return [];
  }
}

export async function getCreditCardById(id: string): Promise<CreditCardDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id,
        account: {
          workspaceId: session.user.workspaceId,
        },
      },
      include: {
        account: true,
      },
    });

    if (!creditCard) return null;

    const availableLimit = Number(creditCard.limit) - Number(creditCard.usedAmount);
    const usagePercentage =
      Number(creditCard.limit) > 0
        ? (Number(creditCard.usedAmount) / Number(creditCard.limit)) * 100
        : 0;

    return {
      id: creditCard.id,
      accountId: creditCard.accountId,
      limit: Number(creditCard.limit),
      initialBalance: Number(creditCard.initialBalance),
      usedAmount: Number(creditCard.usedAmount),
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
      color: creditCard.color || '#6366f1',
      createdAt: creditCard.createdAt.toISOString(),
      updatedAt: creditCard.updatedAt.toISOString(),
      account: {
        id: creditCard.account.id,
        name: creditCard.account.name,
        type: creditCard.account.type,
        color: creditCard.account.color || '#000000',
      },
      availableLimit,
      usagePercentage,
    };
  } catch (error) {
    console.error('Error fetching credit card:', error);
    return null;
  }
}
