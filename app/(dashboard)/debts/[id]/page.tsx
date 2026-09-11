import { getAccounts } from '@/lib/queries/accounts';
import { getCategories } from '@/lib/queries/categories';
import { getCreditCards } from '@/lib/queries/credit-cards';
import { getDebtById } from '@/lib/queries/debts';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { getTransactionsByDebtId } from '@/lib/queries/transactions';
import { notFound } from 'next/navigation';
import { DebtDetail } from './components/debt-detail';

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [debt, transactions, accounts, categories, paymentMethods, creditCards] = await Promise.all(
    [
      getDebtById(id),
      getTransactionsByDebtId(id),
      getAccounts(),
      getCategories(),
      getPaymentMethods(),
      getCreditCards(),
    ],
  );

  if (!debt) {
    notFound();
  }

  return (
    <DebtDetail
      debt={debt}
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      paymentMethods={paymentMethods}
      creditCards={creditCards}
    />
  );
}
