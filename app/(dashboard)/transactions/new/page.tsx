import { TransactionFormPage } from '@/app/(dashboard)/transactions/components/transaction-form-page';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getCostCenters } from '@/lib/queries/cost-centers';
import { getCreditCards } from '@/lib/queries/credit-cards';
import { getDebts } from '@/lib/queries/debts';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { getServerSession } from 'next-auth';

export default async function NewTransactionPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [categories, suppliers, accounts, costCenters, paymentMethods, creditCards, debts] =
    await Promise.all([
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
      getPaymentMethods(),
      getCreditCards(),
      getDebts(),
    ]);

  return (
    <TransactionFormPage
      categories={categories}
      suppliers={suppliers}
      accounts={accounts}
      costCenters={costCenters}
      paymentMethods={paymentMethods}
      creditCards={creditCards}
      debts={debts}
    />
  );
}
