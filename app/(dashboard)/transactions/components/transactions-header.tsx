'use client';

import { ActionButtons } from '@/app/(dashboard)/transactions/components/action-buttons';
import { Filters } from '@/app/(dashboard)/transactions/components/filters';
import { MonthSelector } from '@/components/month-selector';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useState } from 'react';
import { TransferModal } from './transfer-modal';

interface TransactionsHeaderProps {
  categories: { id: string; name: string; type: string; color: string }[];
  suppliers: any[];
  accounts: any[];
  accountsWithBalance?: any[];
  costCenters?: { id: string; name: string }[];
  paymentMethods?: any[];
  creditCards?: any[];
  transactionCounts?: Record<string, number>;
  users?: { id: string; name: string | null; email: string }[];
  canModify?: boolean;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function TransactionsHeader({
  categories,
  suppliers,
  accounts,
  accountsWithBalance,
  costCenters = [],
  paymentMethods = [],
  creditCards = [],
  transactionCounts,
  users = [],
  canModify,
  paginationSlotRef,
}: TransactionsHeaderProps) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const isEditing = !!canModify;
  const {
    searchParams,
    showFilters,
    toggleFilters,
    hasActiveFilters,
    applyFilters,
    handleSearch,
    handleClearFilters,
  } = useUrlFilters({ persistSearch: true, includePeriod: true });

  return (
    <>
      <ListPageHeader
        title="Transações"
        description="Monitore e gerencie todas as suas entradas e saídas."
        headerActions={
          <div className="max-md:w-full">
            <MonthSelector transactionCounts={transactionCounts} restoreOnMount={false} />
          </div>
        }
        searchParams={searchParams}
        onSearch={handleSearch}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        onToggleFilters={toggleFilters}
        createActions={
          isEditing ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <ActionButtons setIsTransferModalOpen={setIsTransferModalOpen} />
            </div>
          ) : undefined
        }
        paginationSlotRef={paginationSlotRef}
        filtersPanel={
          <Filters
            // Remonta quando a URL muda (ex.: filtros restaurados) para ressincronizar o rascunho.
            key={searchParams.toString()}
            searchParams={searchParams}
            applyFilters={applyFilters}
            handleClearFilters={handleClearFilters}
            categories={categories}
            accounts={accounts}
            users={users}
          />
        }
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accountsWithBalance || accounts}
        paymentMethods={paymentMethods}
        creditCards={creditCards}
      />
    </>
  );
}
