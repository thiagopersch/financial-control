import { getSession } from '@/lib/auth/session';
import { cachedForWorkspace } from '@/lib/cache/redis';
import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType, type AccountType } from '@prisma/client';

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
  const session = await getSession();
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

export async function getAccountsWithBalance(): Promise<(AccountDTO & { balance: number })[]> {
  const session = await getSession();
  if (!session) return [];
  const workspaceId = session.user.workspaceId;

  try {
    return await cachedForWorkspace(
      workspaceId,
      ['accounts', 'tx'],
      ['accounts-with-balance'],
      60,
      async () => {
        const paid = { workspaceId, status: TransactionStatus.PAID, accountId: { not: null } };

        // Saldo agregado no banco (antes: todas as transações pagas, somadas em JS).
        // Transferências: notas "[SAÍDA]..." debitam a conta, as demais creditam.
        const [accounts, byType, transferOut] = await Promise.all([
          prisma.account.findMany({ where: { workspaceId }, orderBy: { name: 'asc' } }),
          prisma.transaction.groupBy({
            by: ['accountId', 'type'],
            where: paid,
            _sum: { amount: true },
          }),
          prisma.transaction.groupBy({
            by: ['accountId'],
            where: { ...paid, type: TransactionType.TRANSFER, notes: { startsWith: '[SAÍDA]' } },
            _sum: { amount: true },
          }),
        ]);

        const balanceByAccount = new Map<string, number>();
        const add = (accountId: string | null, delta: number) => {
          if (!accountId) return;
          balanceByAccount.set(accountId, (balanceByAccount.get(accountId) || 0) + delta);
        };
        for (const group of byType) {
          const amount = Number(group._sum.amount || 0);
          if (group.type === TransactionType.INCOME) add(group.accountId, amount);
          else if (group.type === TransactionType.EXPENSE) add(group.accountId, -amount);
          else if (group.type === TransactionType.TRANSFER) add(group.accountId, amount);
        }
        // Todas as transferências entraram como crédito acima; as de saída valem −valor.
        for (const group of transferOut) add(group.accountId, -2 * Number(group._sum.amount || 0));

        return accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          color: account.color || '#000000',
          workspaceId: account.workspaceId,
          createdAt: account.createdAt.toISOString(),
          updatedAt: account.updatedAt.toISOString(),
          balance: balanceByAccount.get(account.id) || 0,
        }));
      },
    );
  } catch (error) {
    console.error('Error fetching accounts with balance:', error);
    return [];
  }
}

export async function getAccountById(id: string): Promise<AccountDTO | null> {
  const session = await getSession();
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
