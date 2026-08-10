import { DebtFormPage } from '@/app/(dashboard)/debts/components/debt-form-page';
import { getAccounts } from '@/lib/queries/accounts';
import { getCategories } from '@/lib/queries/categories';
import { getCreditCards } from '@/lib/queries/credit-cards';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { getSuppliers } from '@/lib/queries/suppliers';

export default async function NewDebtPage() {
  const [accounts, categories, suppliers, paymentMethods, creditCards] = await Promise.all([
    getAccounts(),
    getCategories(),
    getSuppliers(),
    getPaymentMethods(),
    getCreditCards(),
  ]);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <DebtFormPage
      accounts={accounts}
      categories={expenseCategories}
      suppliers={suppliers}
      paymentMethods={paymentMethods}
      creditCards={creditCards}
    />
  );
}
