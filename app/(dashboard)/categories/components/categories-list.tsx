'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { deleteCategory } from '@/lib/actions/categories';
import type { CategoryDTO } from '@/lib/queries/categories';
import { showError, showSuccess } from '@/lib/utils/toast';
import { TransactionType } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CategoriesForm } from './categories-form';
import { CategoriesHeader } from './categories-header';

interface CategoriesListProps {
  categories: CategoryDTO[];
  onRefresh: () => void;
  userRole?: string;
}

export function CategoriesList({ categories, onRefresh, userRole }: CategoriesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      const result = await deleteCategory(categoryToDelete);
      if (result.success) {
        showSuccess('Categoria excluída com sucesso');
        onRefresh();
      } else {
        showError(result.error || 'Erro ao excluir categoria');
      }
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
    }
  };

  const openCreate = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const openEdit = (category: CategoryDTO) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
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

  const columns = initialColumns.filter((col) => col.id !== 'actions' || userRole !== 'VIEWER');

  return (
    <div className="flex flex-col gap-4">
      <CategoriesHeader onCreate={openCreate} />
      <DataTable columns={columns} data={categories} emptyMessage="Nenhuma categoria criada." />

      <CategoriesForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={selectedCategory}
        onSuccess={() => {
          onRefresh();
          setIsFormOpen(false);
        }}
      />

      <DeleteConfirmModal
        title="Exclusão de Categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
