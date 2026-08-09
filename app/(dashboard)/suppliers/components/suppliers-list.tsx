'use client';

import { ActionsDataTable } from '@/components/ui/actions-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { deleteSupplier } from '@/lib/actions/suppliers';
import type { SupplierDTO } from '@/lib/queries/suppliers';
import { formatDocument } from '@/lib/utils/document';
import { showError, showSuccess } from '@/lib/utils/toast';
import { SupplierPersonType } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { SuppliersForm } from './suppliers-form';
import { SuppliersHeader } from './suppliers-header';

interface SuppliersListProps {
  suppliers: SupplierDTO[];
  onRefresh: () => void;
}

export function SuppliersList({ suppliers, onRefresh }: SuppliersListProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const handleDelete = (id: string) => {
    setSupplierToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      const result = await deleteSupplier(supplierToDelete);
      if (result.success) {
        showSuccess('Fornecedor excluído com sucesso');
        onRefresh();
      } else {
        showError(result.error || 'Erro ao excluir fornecedor');
      }
      setIsDeleteOpen(false);
      setSupplierToDelete(null);
    }
  };

  const openCreate = () => {
    setSelectedSupplier(null);
    setIsFormOpen(true);
  };

  const openEdit = (supplier: SupplierDTO) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

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

  return (
    <div className="flex flex-col gap-4">
      <SuppliersHeader onCreate={openCreate} paginationSlotRef={setPaginationSlot} />
      <DataTable
        columns={columns}
        data={suppliers}
        emptyMessage="Nenhum fornecedor criado."
        paginationSlot={paginationSlot}
      />

      <SuppliersForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplier={selectedSupplier}
        onSuccess={() => {
          onRefresh();
          setIsFormOpen(false);
        }}
      />

      <DeleteConfirmModal
        title="Excluir Fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
