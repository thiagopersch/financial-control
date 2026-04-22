'use client';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { deleteCostCenter } from '@/lib/actions/cost-centers';
import type { CostCenterDTO } from '@/lib/queries/cost-centers';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { CostCentersForm } from './cost-centers-form';
import { CostCentersHeader } from './cost-centers-header';

interface CostCentersListProps {
  costCenters: CostCenterDTO[];
  onRefresh: () => void;
}

export function CostCentersList({ costCenters, onRefresh }: CostCentersListProps) {
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenterDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setCostCenterToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (costCenterToDelete) {
      const result = await deleteCostCenter(costCenterToDelete);
      if (result.success) {
        showSuccess('Centro de custo excluído com sucesso');
        onRefresh();
      } else {
        showError(result.error || 'Erro ao excluir centro de custo');
      }
      setIsDeleteOpen(false);
      setCostCenterToDelete(null);
    }
  };

  const openCreate = () => {
    setSelectedCostCenter(null);
    setIsFormOpen(true);
  };

  const openEdit = (costCenter: CostCenterDTO) => {
    setSelectedCostCenter(costCenter);
    setIsFormOpen(true);
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
      <CostCentersHeader onCreate={openCreate} />
      <DataTable
        columns={columns}
        data={costCenters}
        emptyMessage="Nenhum centro de custo criado."
      />

      <CostCentersForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        costCenter={selectedCostCenter}
        onSuccess={() => {
          onRefresh();
          setIsFormOpen(false);
        }}
      />

      <DeleteConfirmModal
        title="Excluir Centro de Custo"
        description="Tem certeza que deseja excluir este centro de custo? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
