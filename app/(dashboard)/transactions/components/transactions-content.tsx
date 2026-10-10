'use client';

import { PeriodLoading } from '@/components/ui/loading-overlay';
import type { WorkspaceUserOption } from '@/lib/queries/users';
import { useState } from 'react';
import { TransactionsHeader } from './transactions-header';
import { TransactionsTable } from './transactions-table';

interface TransactionsContentProps {
  categories: any[];
  suppliers: any[];
  accounts: any[];
  accountsWithBalance?: any[];
  costCenters?: { id: string; name: string }[];
  paymentMethods?: any[];
  creditCards?: any[];
  transactionCounts?: Record<string, number>;
  users?: WorkspaceUserOption[];
  canModify?: boolean;
  transactions: any[];
  totalCount: number;
  totalAmount: number;
  totalExpenseAmount: number;
  totalIncomeAmount: number;
  expenseCount: number;
  incomeCount: number;
  page: number;
  pageSize: number;
}

export function TransactionsContent({
  categories,
  suppliers,
  accounts,
  accountsWithBalance,
  costCenters,
  paymentMethods,
  creditCards,
  transactionCounts,
  users,
  canModify,
  transactions,
  totalCount,
  totalAmount,
  totalExpenseAmount,
  totalIncomeAmount,
  expenseCount,
  incomeCount,
  page,
  pageSize,
}: TransactionsContentProps) {
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <TransactionsHeader
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
        accountsWithBalance={accountsWithBalance}
        costCenters={costCenters}
        paymentMethods={paymentMethods}
        creditCards={creditCards}
        transactionCounts={transactionCounts}
        users={users}
        canModify={canModify}
        paginationSlotRef={setPaginationSlot}
      />
      <PeriodLoading size="md" className="rounded-xl">
        <TransactionsTable
          transactions={transactions}
          categories={categories}
          suppliers={suppliers}
          accounts={accounts}
          costCenters={costCenters}
          canModify={canModify}
          totalCount={totalCount}
          totalAmount={totalAmount}
          totalExpenseAmount={totalExpenseAmount}
          totalIncomeAmount={totalIncomeAmount}
          expenseCount={expenseCount}
          incomeCount={incomeCount}
          page={page}
          pageSize={pageSize}
          paginationSlot={paginationSlot}
        />
      </PeriodLoading>
    </>
  );
}
