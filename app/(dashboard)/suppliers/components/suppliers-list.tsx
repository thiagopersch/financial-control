'use client';

import { ActionsDataTable } from '@/components/ui/actions-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteSupplier } from '@/lib/actions/suppliers';
import type { SupplierDTO } from '@/lib/queries/suppliers';
import { formatDocument } from '@/lib/utils/document';
import { SupplierPersonType } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MapPin, Phone } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { SuppliersForm } from './suppliers-form';
import { SuppliersHeader } from './suppliers-header';

interface SuppliersListProps {
  suppliers: SupplierDTO[];
  onRefresh: () => void;
  totalCount: number;
  page: number;
  pageSize: number;
}

export function SuppliersList({
  suppliers,
  onRefresh,
  totalCount,
  page,
  pageSize,
}: SuppliersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const {
    selected: selectedSupplier,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<SupplierDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteSupplier, {
    successMessage: 'Fornecedor excluído com sucesso',
    errorMessage: 'Erro ao excluir fornecedor',
    onSuccess: onRefresh,
  });

  const columns: ColumnDef<SupplierDTO>[] = [
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
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'personType',
      header: 'Tipo',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.personType === SupplierPersonType.INDIVIDUAL
            ? 'Pessoa Física'
            : 'Pessoa Jurídica'}
        </span>
      ),
    },
    {
      accessorKey: 'document',
      header: 'CNPJ/CPF',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDocument(row.original.document)}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.isActive
              ? 'border-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'border-none bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }
        >
          {row.original.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contato',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Phone className="text-muted-foreground h-3 w-3" />
          <span>{row.original.contact || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Endereço',
      cell: ({ row }) => (
        <div className="flex max-w-[200px] items-center gap-1 truncate">
          <MapPin className="text-muted-foreground h-3 w-3 shrink-0" />
          <span className="truncate">{row.original.address || '-'}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => <ActionsDataTable row={row} onEdit={openEdit} onDelete={handleDelete} />,
    },
  ];

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <SuppliersHeader onCreate={openCreate} paginationSlotRef={setPaginationSlot} />
      <DataTable
        columns={columns}
        data={suppliers}
        emptyMessage="Nenhum fornecedor criado."
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

      <SuppliersForm
        isOpen={isFormOpen}
        onClose={close}
        supplier={selectedSupplier}
        onSuccess={() => {
          onRefresh();
          close();
        }}
      />

      <DeleteConfirmModal
        title="Excluir Fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
