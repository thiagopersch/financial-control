import { DebtsForm } from '@/components/debts/debts-form';
import { Skeleton } from '@/components/ui/skeleton';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getAccounts } from '@/lib/queries/accounts';
import { getServerSession } from 'next-auth';
import { Suspense } from 'react';

async function getDebts() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return [];
  }

  const debts = await prisma.debt.findMany({
    where: {
      workspaceId: session.user.workspaceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return debts.map((debt) => ({
    ...debt,
    initialValue: Number(debt.initialValue),
    currentValue: Number(debt.currentValue),
    interestRate: debt.interestRate ? Number(debt.interestRate) : null,
    minimumPayment: Number(debt.minimumPayment),
    installments: debt.installments,
    startDate: debt.startDate.toISOString(),
    endDate: debt.endDate?.toISOString() || null,
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
  }));
}

export default async function DebtsPage() {
  const [debts, accounts] = await Promise.all([getDebts(), getAccounts()]);

  const accountsData = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    color: account.color,
    workspaceId: account.workspaceId,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }));

  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <DebtsForm initialDebts={debts} initialAccounts={accountsData} />
    </Suspense>
  );
}
