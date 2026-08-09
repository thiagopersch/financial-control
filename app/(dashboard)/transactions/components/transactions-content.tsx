'use client';

import { useState } from 'react';
import { TransactionsHeader } from './transactions-header';
import { TransactionsTable } from './transactions-table';

interface TransactionsContentProps {
  categories: any[];
  suppliers: any[];
  accounts: any[];
  accountsWithBalance?: any[];
  costCenters?: { id: string; name: string }[];
  availableRange?: {
    minDate: Date | string | null;
    maxDate: Date | string | null;
  };
  transactionCounts?: Record<string, number>;
  userRole?: string;
  transactions: any[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
}

export function TransactionsContent({
  categories,
  suppliers,
  accounts,
  accountsWithBalance,
  costCenters,
  availableRange,
  transactionCounts,
  userRole,
  transactions,
  totalCount,
  totalAmount,
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
        availableRange={availableRange}
        transactionCounts={transactionCounts}
        userRole={userRole}
        paginationSlotRef={setPaginationSlot}
      />
      <TransactionsTable
        transactions={transactions}
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
        costCenters={costCenters}
        userRole={userRole}
        totalCount={totalCount}
        totalAmount={totalAmount}
        page={page}
        pageSize={pageSize}
        paginationSlot={paginationSlot}
      />
    </>
  );
}
