import { TransactionFormPage } from '@/app/(dashboard)/transactions/components/transaction-form-page';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getCostCenters } from '@/lib/queries/cost-centers';
import { getCreditCards } from '@/lib/queries/credit-cards';
import { getDebts } from '@/lib/queries/debts';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { getWorkspaceUsers } from '@/lib/queries/users';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [
    transaction,
    categories,
    suppliers,
    accounts,
    costCenters,
    paymentMethods,
    creditCards,
    debts,
  ] = await Promise.all([
    prisma.transaction.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
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
    getPaymentMethods(),
    getCreditCards(),
    getDebts(),
  ]);

  if (!transaction) {
    notFound();
  }

  // Ativos + o "Pago por" atual, mesmo que o usuário tenha sido desativado depois.
  const users = await getWorkspaceUsers({ activeOnly: true, includeIds: [transaction.paidById] });

  const initialData = {
    ...transaction,
    amount: Number(transaction.amount),
  };

  return (
    <TransactionFormPage
      categories={categories}
      suppliers={suppliers}
      accounts={accounts}
      costCenters={costCenters}
      paymentMethods={paymentMethods}
      creditCards={creditCards}
      debts={debts}
      users={users}
      initialData={initialData}
    />
  );
}
