import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export type PaymentMethodDTO = {
  id: string;
  name: string;
  color: string | null;
  isCreditCard: boolean;
  workspaceId: string;
  accountIds: string[];
  accounts: { id: string; name: string; color: string | null }[];
  createdAt: string;
  updatedAt: string;
};

export async function getPaymentMethods(): Promise<PaymentMethodDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      include: {
        accounts: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return paymentMethods.map((pm) => ({
      id: pm.id,
      name: pm.name,
      color: pm.color || '#6366f1',
      isCreditCard: pm.isCreditCard,
      workspaceId: pm.workspaceId,
      accountIds: pm.accounts.map((a) => a.id),
      accounts: pm.accounts,
      createdAt: pm.createdAt.toISOString(),
      updatedAt: pm.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

export type GetPaymentMethodsParams = {
  q?: string;
  isCreditCard?: string;
  page?: number;
  pageSize?: number;
};

export async function getPaymentMethodsPaginated(
  params: GetPaymentMethodsParams = {},
): Promise<{ paymentMethods: PaymentMethodDTO[]; totalCount: number }> {
  const session = await getServerSession(authOptions);
  if (!session) return { paymentMethods: [], totalCount: 0 };

  const { q, isCreditCard, page = 1, pageSize = 10 } = params;

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  if (isCreditCard === 'true') where.isCreditCard = true;
  else if (isCreditCard === 'false') where.isCreditCard = false;

  if (q) where.name = { contains: q.trim(), mode: 'insensitive' };

  try {
    const [paymentMethods, totalCount] = await Promise.all([
      prisma.paymentMethod.findMany({
        where,
        include: {
          accounts: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.paymentMethod.count({ where }),
    ]);

    return {
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        name: pm.name,
        color: pm.color || '#6366f1',
        isCreditCard: pm.isCreditCard,
        workspaceId: pm.workspaceId,
        accountIds: pm.accounts.map((a) => a.id),
        accounts: pm.accounts,
        createdAt: pm.createdAt.toISOString(),
        updatedAt: pm.updatedAt.toISOString(),
      })),
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return { paymentMethods: [], totalCount: 0 };
  }
}

export async function getPaymentMethodById(id: string): Promise<PaymentMethodDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      include: {
        accounts: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!paymentMethod) return null;

    return {
      id: paymentMethod.id,
      name: paymentMethod.name,
      color: paymentMethod.color,
      isCreditCard: paymentMethod.isCreditCard,
      workspaceId: paymentMethod.workspaceId,
      accountIds: paymentMethod.accounts.map((a) => a.id),
      accounts: paymentMethod.accounts,
      createdAt: paymentMethod.createdAt.toISOString(),
      updatedAt: paymentMethod.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return null;
  }
}
