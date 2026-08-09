import { DebtFormPage } from '@/app/(dashboard)/debts/components/debt-form-page';
import { getAccounts } from '@/lib/queries/accounts';
import { getCategories } from '@/lib/queries/categories';
import { getSuppliers } from '@/lib/queries/suppliers';

export default async function NewDebtPage() {
  const [accounts, categories, suppliers] = await Promise.all([
    getAccounts(),
    getCategories(),
    getSuppliers(),
  ]);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <DebtFormPage accounts={accounts} categories={expenseCategories} suppliers={suppliers} />
  );
}
