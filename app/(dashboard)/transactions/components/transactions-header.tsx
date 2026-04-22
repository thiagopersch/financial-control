'use client';

import { ActionButtons } from '@/app/(dashboard)/transactions/components/action-buttons';
import { Filters } from '@/app/(dashboard)/transactions/components/filters';
import { SearchInput } from '@/components/search';
import { showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { TransactionModal } from './transaction-modal';
import { TransferModal } from './transfer-modal';

interface TransactionsHeaderProps {
  categories: { id: string; name: string; type: string; color: string }[];
  suppliers: any[];
  accounts: any[];
  availableRange?: {
    minDate: Date | string | null;
    maxDate: Date | string | null;
  };
  transactionCounts?: Record<string, number>;
  userRole?: string;
}

export function TransactionsHeader({
  categories,
  suppliers,
  accounts,
  availableRange,
  transactionCounts,
  userRole,
}: TransactionsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = userRole && userRole !== 'VIEWER';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
      if (key === 'from' || key === 'to') {
        params.delete('month');
      }
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push(window.location.pathname);
  };

  const exportCSV = () => {
    const params = new URLSearchParams(searchParams);
    const url = `/api/transactions/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccess('Exportação iniciada!', 'O download do arquivo foi iniciado.');
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
        <div className="flex flex-col gap-2 max-md:flex-col-reverse max-md:gap-3 sm:items-center md:flex-row">
          {isEditing && (
            <ActionButtons
              exportCSV={exportCSV}
              setIsTransferModalOpen={setIsTransferModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </div>
      </div>

      <SearchInput searchParams={searchParams} handleSearch={handleSearch} />

      <Filters
        searchParams={searchParams}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
        availableRange={availableRange}
        transactionCounts={transactionCounts}
        categories={categories}
        accounts={accounts}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}
