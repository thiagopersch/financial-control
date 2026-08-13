'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deletePaymentMethod } from '@/lib/actions/payment-methods';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash2, Wallet } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PaymentMethodsForm } from './payment-methods-form';
import { PaymentMethodsHeader } from './payment-methods-header';

interface PaymentMethodsListProps {
  paymentMethods: PaymentMethodDTO[];
  accounts: AccountDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  onRefresh: () => void;
}

export function PaymentMethodsList({
  paymentMethods,
  accounts,
  totalCount,
  page,
  pageSize,
  onRefresh,
}: PaymentMethodsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const {
    selected: selectedPaymentMethod,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<PaymentMethodDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deletePaymentMethod, {
    successMessage: 'Meio de pagamento excluído com sucesso',
    errorMessage: 'Erro ao excluir meio de pagamento',
    onSuccess: onRefresh,
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const columns: ColumnDef<PaymentMethodDTO>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Nome
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.original.color || '#6366f1' }}
          />
          <span className="font-semibold">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'accounts',
      header: 'Contas vinculadas',
      cell: ({ row }) =>
        row.original.accounts.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.accounts.map((account) => (
              <Badge key={account.id} variant="secondary" className="gap-1.5 font-normal">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: account.color || '#000000' }}
                />
                {account.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">Nenhuma conta vinculada</span>
        ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="space-x-2 text-right whitespace-nowrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row.original)}
            className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PaymentMethodsHeader onCreate={openCreate} paginationSlotRef={setPaginationSlot} />

      {totalCount === 0 ? (
        <div className="bg-muted/30 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
          <div className="bg-background mb-4 rounded-full p-4 shadow-sm">
            <Wallet className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium">Nenhum meio de pagamento encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Cadastre um meio de pagamento e vincule as contas correspondentes.
          </p>
          <Button onClick={openCreate}>Adicionar Meio de Pagamento</Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={paymentMethods}
          emptyMessage="Nenhum meio de pagamento encontrado."
          manualPagination={{
            page,
            pageSize,
            totalCount,
            onPageChange: (p) => updateParam('page', String(p)),
            onPageSizeChange: (size) => {
              const params = new URLSearchParams(searchParams);
              params.set('pageSize', String(size));
              params.set('page', '1');
              router.push(`${window.location.pathname}?${params.toString()}`);
            },
          }}
          paginationSlot={paginationSlot}
        />
      )}

      <PaymentMethodsForm
        isOpen={isFormOpen}
        onClose={close}
        paymentMethod={selectedPaymentMethod}
        accounts={accounts}
        onSuccess={() => {
          onRefresh();
          close();
        }}
      />

      <DeleteConfirmModal
        title="Excluir Meio de Pagamento"
        description="Tem certeza que deseja excluir este meio de pagamento? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
