'use client';

import { ActionButtons } from '@/app/(dashboard)/transactions/components/action-buttons';
import { Filters } from '@/app/(dashboard)/transactions/components/filters';
import { SearchInput } from '@/components/search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { TransferModal } from './transfer-modal';

interface TransactionsHeaderProps {
  categories: { id: string; name: string; type: string; color: string }[];
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
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function TransactionsHeader({
  categories,
  suppliers,
  accounts,
  accountsWithBalance,
  costCenters = [],
  availableRange,
  transactionCounts,
  userRole,
  paginationSlotRef,
}: TransactionsHeaderProps) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = userRole && userRole !== 'VIEWER';
  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => !['page', 'pageSize', 'q'].includes(key),
  );

  const applyFilters = (params: URLSearchParams) => {
    params.delete('page');
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    applyFilters(params);
  };

  const handleClearFilters = () => {
    router.push(window.location.pathname);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight max-md:text-2xl">
            Transações
          </h1>
          <p className="text-muted-foreground max-md:text-sm">
            Monitore e gerencie todas as suas entradas e saídas.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center gap-2 md:flex-1">
          <SearchInput searchParams={searchParams} handleSearch={handleSearch} />
          <Button
            type="button"
            variant={hasActiveFilters ? 'default' : 'outline'}
            size="lg"
            onClick={() => setShowFilters((prev) => !prev)}
            className={cn('shrink-0')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        <div className="flex w-full flex-col items-center gap-3 max-md:order-3 sm:flex-row md:w-auto">
          {isEditing && (
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <ActionButtons setIsTransferModalOpen={setIsTransferModalOpen} />
            </div>
          )}
          <div ref={paginationSlotRef} />
        </div>
      </div>

      {showFilters && (
        <Filters
          searchParams={searchParams}
          applyFilters={applyFilters}
          handleClearFilters={handleClearFilters}
          availableRange={availableRange}
          transactionCounts={transactionCounts}
          categories={categories}
          accounts={accounts}
        />
      )}

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accountsWithBalance || accounts}
      />
    </div>
  );
}
