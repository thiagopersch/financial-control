import { TransactionsContent } from '@/app/(dashboard)/transactions/components/transactions-content';
import { authOptions } from '@/lib/auth-options';
import { autoMoveOverdueTransactions } from '@/lib/actions/transactions';
import { hasPermission } from '@/lib/permissions/has-permission';
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
    paidBy?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;
  const session = await getServerSession(authOptions);

  await autoMoveOverdueTransactions();

  const transactionCounts = await getTransactionCountsByYear();

  if (!session) return null;

  const where = buildTransactionWhere(searchParams, session.user.workspaceId);

  const pageSize = parsePageSize(searchParams.pageSize);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const [
    allTransactions,
    categories,
    suppliers,
    accounts,
    costCenters,
    accountsWithBalance,
    paymentMethods,
    creditCards,
    users,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        supplier: true,
        account: true,
        paidBy: { select: { id: true, name: true, email: true } },
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
    getCostCenters(),
    getAccountsWithBalance(),
    getPaymentMethods(),
    getCreditCards(),
    getWorkspaceUsers(),
  ]);

  const sortedTransactions = [...allTransactions].sort(compareTransactionsDefault);

  const totalCount = sortedTransactions.length;
  // Totais de todas as transações filtradas (não só da página atual).
  const totals = summarizeTransactions(sortedTransactions);

  const pageTransactions = sortedTransactions.slice((page - 1) * pageSize, page * pageSize);

  const transactions = pageTransactions.map((transaction) => ({
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
