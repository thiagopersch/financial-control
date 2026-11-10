import { getPageFilters } from '@/lib/queries/page-filters';
import { TransactionsContent } from '@/app/(dashboard)/transactions/components/transactions-content';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { cachedForWorkspace } from '@/lib/cache/redis';
import prisma from '@/lib/prisma';
import { getTransactionCountsByYear } from '@/lib/queries/dashboard';
import { getCostCenters } from '@/lib/queries/cost-centers';
import { getAccountsWithBalance } from '@/lib/queries/accounts';
import { getCreditCards } from '@/lib/queries/credit-cards';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { buildTransactionWhere } from '@/lib/queries/transactions';
import { getWorkspaceUsers } from '@/lib/queries/users';
import { parsePageSize } from '@/lib/constants/pagination';
import { compareTransactionsDefault } from '@/lib/utils/transaction-order';
import { summarizeTransactions } from '@/lib/utils/transaction-totals';

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
    paidBy?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  // Filtros/busca vêm do cookie (espelho do localStorage); a URL traz só período e paginação.
  const searchParams: Awaited<typeof searchParamsPromise> = {
    ...(await getPageFilters('/transactions')),
    ...(await searchParamsPromise),
  };
  const session = await getSession();
  if (!session) return null;

  const workspaceId = session.user.workspaceId;
  const where = buildTransactionWhere(searchParams, workspaceId);

  const pageSize = parsePageSize(searchParams.pageSize);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  // Tudo em paralelo. A ordenação padrão (pagas por último, tipo, valor,
  // vencimento…) não é expressável em `orderBy`, então buscamos só as colunas de
  // ordenação/totais de todas as linhas filtradas e os detalhes (com relações)
  // apenas da página atual — antes eram todas as linhas com 4 relações.
  const [
    sortKeys,
    transactionCounts,
    categories,
    suppliers,
    accountsWithBalance,
    costCenters,
    paymentMethods,
    creditCards,
    users,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        date: true,
        dueDate: true,
        competence: true,
      },
    }),
    getTransactionCountsByYear(),
    cachedForWorkspace(workspaceId, 'categories', ['tx-page-categories'], 300, () =>
      prisma.category.findMany({ where: { workspaceId }, orderBy: { name: 'asc' } }),
    ),
    cachedForWorkspace(workspaceId, 'suppliers', ['tx-page-suppliers'], 300, () =>
      prisma.supplier.findMany({ where: { workspaceId }, orderBy: { name: 'asc' } }),
    ),
    getAccountsWithBalance(),
    getCostCenters(),
    getPaymentMethods(),
    getCreditCards(),
    getWorkspaceUsers(),
  ]);

  const sortedKeys = [...sortKeys].sort(compareTransactionsDefault);
  const totalCount = sortedKeys.length;
  // Totais de todas as transações filtradas (não só da página atual).
  const totals = summarizeTransactions(sortedKeys);

  const pageIds = sortedKeys.slice((page - 1) * pageSize, page * pageSize).map((t) => t.id);
  const pageRows = pageIds.length
    ? await prisma.transaction.findMany({
        where: { id: { in: pageIds }, workspaceId },
        include: {
          category: true,
          supplier: true,
          account: true,
          paidBy: { select: { id: true, name: true, email: true } },
        },
      })
    : [];
  const rowById = new Map(pageRows.map((row) => [row.id, row]));

  const transactions = pageIds
    .map((id) => rowById.get(id))
    .filter((row): row is NonNullable<typeof row> => !!row)
    .map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    }));

  // Mesmas contas do saldo (evita buscar as contas duas vezes).
  const formattedAccounts = accountsWithBalance.map(({ balance: _balance, ...account }) => account);

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <TransactionsContent
        categories={categories}
        suppliers={suppliers}
        accounts={formattedAccounts}
        accountsWithBalance={accountsWithBalance}
        costCenters={costCenters}
        paymentMethods={paymentMethods}
        creditCards={creditCards}
        users={users}
        transactionCounts={transactionCounts}
        canModify={hasPermission(session.user.permissions, 'transactions', 'CREATE')}
        transactions={transactions}
        totalCount={totalCount}
        totals={totals}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
