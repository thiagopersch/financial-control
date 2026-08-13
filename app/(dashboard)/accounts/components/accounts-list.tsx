'use client';

import { ActionsAccounts } from '@/app/(dashboard)/accounts/components/actions';
import { NotFoundAccounts } from '@/app/(dashboard)/accounts/components/not-found';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { ListPagination } from '@/components/ui/list-pagination';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteAccount } from '@/lib/actions/accounts';
import type { AccountDTO } from '@/lib/queries/accounts';
import { Building2, Coins, CreditCard, Landmark, TrendingUp, Wallet2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AccountsForm } from './accounts-form';
import { AccountsHeader } from './accounts-header';

interface AccountsListProps {
  accounts: AccountDTO[];
  onRefresh: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  BANK: Building2,
  WALLET: Wallet2,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: Landmark,
  PIX: Coins,
  INVESTMENT: TrendingUp,
  CRYPTO: Coins,
  OTHERS: Wallet2,
};

const typeLabels: Record<string, string> = {
  BANK: 'Banco',
  WALLET: 'Carteira',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  INVESTMENT: 'Investimento',
  CRYPTO: 'Cripto',
  OTHERS: 'Outros',
};

const typeFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'WALLET', label: 'Carteira' },
  { value: 'BANK', label: 'Banco' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'INVESTMENT', label: 'Investimento' },
];

export function AccountsList({ accounts, onRefresh }: AccountsListProps) {
  const {
    selected: selectedAccount,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<AccountDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteAccount, {
    successMessage: 'Conta excluída com sucesso!',
    errorMessage: 'Não foi possível excluir a conta!',
    onSuccess: onRefresh,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch = account.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || account.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, search, typeFilter]);

  const totalCount = filteredAccounts.length;
  const paginatedAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <AccountsHeader
        showControls={accounts.length > 0}
        searchParams={searchParams}
        onSearch={handleSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        typeFilterOptions={typeFilterOptions}
        onCreate={openCreate}
        paginationSlotRef={setPaginationSlot}
      />

      {accounts.length === 0 && <NotFoundAccounts openCreate={openCreate} />}

      {accounts.length > 0 && (
        <>
          {paginatedAccounts.length === 0 ? (
            <div className="bg-muted/30 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
              <p className="text-muted-foreground">Nenhuma conta encontrada para esta busca.</p>
            </div>
          ) : (
            <ActionsAccounts
              accounts={paginatedAccounts}
              openEdit={openEdit}
              handleDelete={handleDelete}
              typeIcons={typeIcons}
              typeLabels={typeLabels}
            />
          )}

          <ListPagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            paginationSlot={paginationSlot}
          />
        </>
      )}

      <AccountsForm
        isOpen={isFormOpen}
        onClose={close}
        account={selectedAccount}
        onSuccess={() => {
          onRefresh();
          close();
        }}
      />

      <DeleteConfirmModal
        title="Exclusão de sua conta bancária"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
