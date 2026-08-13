'use client';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteCostCenter } from '@/lib/actions/cost-centers';
import type { CostCenterDTO } from '@/lib/queries/cost-centers';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CostCentersForm } from './cost-centers-form';
import { CostCentersHeader } from './cost-centers-header';

interface CostCentersListProps {
  costCenters: CostCenterDTO[];
  onRefresh: () => void;
  totalCount: number;
  page: number;
  pageSize: number;
}

export function CostCentersList({
  costCenters,
  onRefresh,
  totalCount,
  page,
  pageSize,
}: CostCentersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const {
    selected: selectedCostCenter,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<CostCenterDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteCostCenter, {
    successMessage: 'Centro de custo excluído com sucesso',
    errorMessage: 'Erro ao excluir centro de custo',
    onSuccess: onRefresh,
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const columns: ColumnDef<CostCenterDTO>[] = [
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
          <TrendingUp className="text-muted-foreground h-4 w-4" />
          <span className="font-semibold">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.description || '-'}</span>
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
      <CostCentersHeader onCreate={openCreate} paginationSlotRef={setPaginationSlot} />
      <DataTable
        columns={columns}
        data={costCenters}
        emptyMessage="Nenhum centro de custo criado."
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

      <CostCentersForm
        isOpen={isFormOpen}
        onClose={close}
        costCenter={selectedCostCenter}
        onSuccess={() => {
          onRefresh();
          close();
        }}
      />

      <DeleteConfirmModal
        title="Excluir Centro de Custo"
        description="Tem certeza que deseja excluir este centro de custo? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
