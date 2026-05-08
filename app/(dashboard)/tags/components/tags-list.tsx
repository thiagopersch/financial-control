'use client';

import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { deleteTag } from '@/lib/actions/tags';
import type { TagDTO } from '@/lib/queries/tags';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import { Hash, Palette } from 'lucide-react';
import { useState } from 'react';
import { TagsForm } from './tags-form';
import { TagsHeader } from './tags-header';

interface TagsListProps {
  tags: TagDTO[];
}

export function TagsList({ tags }: TagsListProps) {
  const [selectedTag, setSelectedTag] = useState<TagDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  const openCreate = () => {
    setSelectedTag(null);
    setIsFormOpen(true);
  };

  const openEdit = (tag: TagDTO) => {
    setSelectedTag(tag);
    setIsFormOpen(true);
  };

  const openDelete = (tag: TagDTO) => {
    setTagToDelete(tag.id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    const result = await deleteTag(tagToDelete);
    if (result.success) {
      showSuccess('Tag excluída', 'A tag foi excluída com sucesso.');
      setIsDeleteOpen(false);
      setTagToDelete(null);
      handleRefresh();
    } else {
      showError('Erro ao excluir', result.error || 'Erro ao excluir tag');
    }
  };

  const columns: ColumnDef<TagDTO>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <Hash className="h-4 w-4" />
          Nome
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: row.original.color || '#6366f1' }}
          />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'color',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <Palette className="h-4 w-4" />
          Cor
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-10 rounded border"
            style={{ backgroundColor: row.original.color || '#6366f1' }}
          />
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.color || '#6366f1'}
          </span>
        </div>
      ),
    },
    {
      id: 'transactions',
      header: 'Transações',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original._count?.transactions ?? 0}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEdit(row.original)}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => openDelete(row.original)}
            className="text-destructive hover:text-destructive/80 text-sm font-medium transition-colors"
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <TagsHeader onCreate={openCreate} />
      <DataTable
        columns={columns}
        data={tags}
        emptyMessage="Nenhuma tag cadastrada. Crie sua primeira tag para organizar suas transações."
      />
      <TagsForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        tag={selectedTag}
        onSuccess={() => {
          handleRefresh();
          setIsFormOpen(false);
        }}
      />
      <DeleteConfirmModal
        title="Excluir Tag"
        description="Tem certeza que deseja excluir esta tag? As transações vinculadas não serão afetadas."
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
