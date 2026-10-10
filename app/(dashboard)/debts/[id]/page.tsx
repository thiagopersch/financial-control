import { getAccounts } from '@/lib/queries/accounts';
import { getCategories } from '@/lib/queries/categories';
import { getCostCenters } from '@/lib/queries/cost-centers';
import { getCreditCards } from '@/lib/queries/credit-cards';
import { getDebtById } from '@/lib/queries/debts';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { getTransactionsByDebtId } from '@/lib/queries/transactions';
import { getWorkspaceUsers } from '@/lib/queries/users';
import { notFound } from 'next/navigation';
import { DebtDetail } from './components/debt-detail';

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [debt, transactions, accounts, categories, paymentMethods, creditCards, costCenters] =
    await Promise.all([
      getDebtById(id),
      getTransactionsByDebtId(id),
      getAccounts(),
      getCategories(),
      getPaymentMethods(),
      getCreditCards(),
      getCostCenters(),
    ]);

  if (!debt) {
    notFound();
  }

  // Ativos + quem já consta como "Pago por" em alguma parcela (mesmo se inativo).
  const users = await getWorkspaceUsers({
    activeOnly: true,
    includeIds: transactions.map((t) => t.paidById),
  });

  return (
    <DebtDetail
      debt={debt}
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      paymentMethods={paymentMethods}
      creditCards={creditCards}
      costCenters={costCenters}
      users={users}
    />
  );
}
