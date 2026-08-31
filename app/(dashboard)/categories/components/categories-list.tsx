'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteCategory } from '@/lib/actions/categories';
import { hasPermission } from '@/lib/permissions/has-permission';
import type { CategoryDTO } from '@/lib/queries/categories';
import { TransactionType } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CategoriesForm } from './categories-form';
import { CategoriesHeader } from './categories-header';

interface CategoriesListProps {
  categories: CategoryDTO[];
  onRefresh: () => void;
  totalCount: number;
  page: number;
  pageSize: number;
  colors?: string[];
}

export function CategoriesList({
  categories,
  onRefresh,
  totalCount,
  page,
  pageSize,
  colors,
}: CategoriesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const canModify = hasPermission(session?.user?.permissions, 'categories', 'UPDATE');
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const {
    selected: selectedCategory,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<CategoryDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteCategory, {
    successMessage: 'Categoria excluída com sucesso',
    errorMessage: 'Erro ao excluir categoria',
    onSuccess: onRefresh,
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const initialColumns: ColumnDef<CategoryDTO>[] = [
    {
      accessorKey: 'color',
      header: 'Cor',
      cell: ({ row }) => (
        <div
          className="h-5 w-5 rounded-full border border-black/15 shadow-inner"
          style={{ backgroundColor: row.original.color }}
        />
      ),
    },
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
      accessorKey: 'type',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Tipo
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge
            variant={type === TransactionType.INCOME ? 'secondary' : 'destructive'}
            className={
              type === TransactionType.INCOME
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
            }
          >
            {type === TransactionType.INCOME ? 'Receita' : 'Despesa'}
          </Badge>
        );
      },
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
            className="h-8 w-8 hover:bg-neutral-200"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="text-destructive hover:bg-destructive/20 h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columns = initialColumns.filter((col) => col.id !== 'actions' || canModify);

  return (
    <div className="flex flex-col gap-4">
      <CategoriesHeader
        onCreate={openCreate}
        paginationSlotRef={setPaginationSlot}
        colors={colors}
      />
      <DataTable
        columns={columns}
        data={categories}
        emptyMessage="Nenhuma categoria criada."
        paginationSlot={paginationSlot}
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
      />

      <CategoriesForm
        isOpen={isFormOpen}
        onClose={close}
        category={selectedCategory}
        onSuccess={() => {
          onRefresh();
          close();
        }}
      />

      <DeleteConfirmModal
        title="Exclusão de Categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
