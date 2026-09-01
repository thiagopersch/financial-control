import { getDebtById } from '@/lib/queries/debts';
import { getTransactionsByDebtId } from '@/lib/queries/transactions';
import { notFound } from 'next/navigation';
import { DebtDetail } from './components/debt-detail';

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [debt, transactions] = await Promise.all([getDebtById(id), getTransactionsByDebtId(id)]);

  if (!debt) {
    notFound();
  }

  return <DebtDetail debt={debt} transactions={transactions} />;
}
