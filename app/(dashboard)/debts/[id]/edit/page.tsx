import { DebtFormPage } from '@/app/(dashboard)/debts/components/debt-form-page';
import { getAccounts } from '@/lib/queries/accounts';
import { getCategories } from '@/lib/queries/categories';
import { getDebtById } from '@/lib/queries/debts';
import { getSuppliers } from '@/lib/queries/suppliers';
import { notFound } from 'next/navigation';

export default async function EditDebtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [debt, accounts, categories, suppliers] = await Promise.all([
    getDebtById(id),
    getAccounts(),
    getCategories(),
    getSuppliers(),
  ]);

  if (!debt) {
    notFound();
  }

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <DebtFormPage
      debt={debt}
      accounts={accounts}
      categories={expenseCategories}
      suppliers={suppliers}
    />
  );
}
