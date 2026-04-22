import { TransactionsHeader } from '@/app/(dashboard)/transactions/components/transactions-header';
import { TransactionsTable } from '@/app/(dashboard)/transactions/components/transactions-table';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getAvailableRange, getTransactionCountsByYear } from '@/lib/queries/dashboard';
import { type TransactionStatus, type TransactionType } from '@prisma/client';
import { endOfMonth, startOfMonth } from 'date-fns';
import { getServerSession } from 'next-auth';

export default async function TransactionsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    year?: string;
    month?: string;
    type?: string;
    status?: string;
    category?: string;
    account?: string;
    q?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;
  const session = await getServerSession(authOptions);
  const [availableRange, transactionCounts] = await Promise.all([
    getAvailableRange(),
    getTransactionCountsByYear(),
  ]);

  if (!session) return null;

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  // Novos parâmetros: year e month
  const yearParam = searchParams.year;
  const monthParam = searchParams.month;

  if (!yearParam) {
    // Sem parâmetros - usa mês atual
  } else if (yearParam === 'all') {
    // Todos os Períodos - sem filtro de data
  } else if (monthParam === 'all') {
    // Ano completo
    const year = parseInt(yearParam);
    where.date = {
      gte: startOfMonth(new Date(year, 0)),
      lte: endOfMonth(new Date(year, 11)),
    };
  } else if (monthParam) {
    // Mês específico
    const year = parseInt(yearParam);
    const month = parseInt(monthParam);
    where.date = {
      gte: startOfMonth(new Date(year, month - 1)),
      lte: endOfMonth(new Date(year, month - 1)),
    };
  } else if (yearParam) {
    // Apenas ano selecionado sem mês específico - usa mês atual como fallback
    where.date = {
      gte: startOfMonth(new Date()),
      lte: endOfMonth(new Date()),
    };
  } else {
    // Parâmetros from/to legacy (manter compatibilidade)
    let from = startOfMonth(new Date());
    let to = endOfMonth(new Date());

    if (searchParams.from) from = new Date(searchParams.from);
    if (searchParams.to) to = new Date(searchParams.to);

    where.date = {
      gte: from,
      lte: to,
    };
  }

  if (searchParams.type) where.type = searchParams.type as TransactionType;
  if (searchParams.status) where.status = searchParams.status as TransactionStatus;
  if (searchParams.category) where.categoryId = searchParams.category;
  if (searchParams.account) where.accountId = searchParams.account;

  if (searchParams.q) {
    where.OR = [
      { notes: { contains: searchParams.q, mode: 'insensitive' } },
      { category: { name: { contains: searchParams.q, mode: 'insensitive' } } },
      { supplier: { name: { contains: searchParams.q, mode: 'insensitive' } } },
    ];
  }

  const [rawTransactions, categories, suppliers, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        supplier: true,
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.category.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
    }),
    prisma.account.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
    }),
    getAvailableRange(),
    getTransactionCountsByYear(),
  ]);

  const transactions = rawTransactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
    account: transaction.account
      ? {
          ...transaction.account,
        }
      : null,
  }));

  const formattedAccounts = accounts.map((a) => ({
    ...a,
  }));

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <TransactionsHeader
        categories={categories}
        suppliers={suppliers}
        accounts={formattedAccounts}
        availableRange={availableRange}
        transactionCounts={transactionCounts}
        userRole={session.user.role}
      />
      <TransactionsTable
        transactions={transactions}
        categories={categories}
        suppliers={suppliers}
        accounts={formattedAccounts}
        userRole={session.user.role}
      />
    </div>
  );
}
