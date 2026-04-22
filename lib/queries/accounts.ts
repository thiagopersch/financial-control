import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { type AccountType } from '@prisma/client';
import { getServerSession } from 'next-auth';

export type AccountDTO = {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export async function getAccounts(): Promise<AccountDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const accounts = await prisma.account.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      color: account.color || '#000000',
      workspaceId: account.workspaceId,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

export async function getAccountById(id: string): Promise<AccountDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const account = await prisma.account.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!account) return null;

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      color: account.color || '#000000',
      workspaceId: account.workspaceId,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}
