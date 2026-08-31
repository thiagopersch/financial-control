'use client';

import { ActionsDataTable } from '@/components/ui/actions-data-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deletePermissionProfile } from '@/lib/actions/permission-profiles';
import { hasPermission } from '@/lib/permissions/has-permission';
import type { PermissionProfileDTO } from '@/lib/queries/permission-profiles';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { PermissionProfileForm } from './permission-profile-form';

interface PermissionProfilesListProps {
  profiles: PermissionProfileDTO[];
  onRefresh: () => void;
}

export function PermissionProfilesList({ profiles, onRefresh }: PermissionProfilesListProps) {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const canCreate = hasPermission(permissions, 'permission-profiles', 'CREATE');
  const canUpdate = hasPermission(permissions, 'permission-profiles', 'UPDATE');
  const canDelete = hasPermission(permissions, 'permission-profiles', 'DELETE');

  const {
    selected: selectedProfile,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<PermissionProfileDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deletePermissionProfile, {
    successMessage: 'Perfil de permissão excluído com sucesso!',
    errorMessage: 'Não foi possível excluir o perfil de permissão!',
    onSuccess: onRefresh,
  });

  const [search, setSearch] = useState('');
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(term) ||
        (profile.description || '').toLowerCase().includes(term),
    );
  }, [profiles, search]);

  const columns: ColumnDef<PermissionProfileDTO>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => {
        const profile = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{profile.name}</span>
            {profile.isSystem && (
              <Badge variant="secondary" className="gap-1 border-none text-xs">
                <ShieldCheck className="h-3 w-3" /> Sistema
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.description || '—'}</span>
      ),
    },
    {
      accessorKey: 'permissionIds',
      header: 'Permissões',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.permissionIds.length}</span>
      ),
    },
    {
      accessorKey: 'usersCount',
      header: 'Usuários',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.usersCount}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.original.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const profile = row.original;
        return (
          <ActionsDataTable
            row={row}
            onEdit={() => openEdit(profile)}
            onDelete={() => handleDelete(profile.id)}
            disabledDelete={profile.isSystem || profile.usersCount > 0}
          />
        );
      },
    },
  ];

  const visibleColumns = columns.filter((col) => col.id !== 'actions' || canUpdate || canDelete);

  return (
    <div className="flex flex-col gap-4">
      <ListPageHeader
        title="Perfis de Permissão"
        description="Crie perfis e controle exatamente o que cada um pode ver, criar, editar ou excluir."
        showFilterToggle={false}
        searchParams={searchParams}
        onSearch={setSearch}
        canCreate={canCreate}
        createLabel="Novo Perfil"
        onCreate={openCreate}
        paginationSlotRef={setPaginationSlot}
      />

      <DataTable
        columns={visibleColumns}
        data={filteredProfiles}
        emptyMessage="Nenhum perfil de permissão encontrado."
        paginationSlot={paginationSlot}
      />

      <PermissionProfileForm
        isOpen={isFormOpen}
        onClose={close}
        profile={selectedProfile}
        onSuccess={onRefresh}
      />

      <DeleteConfirmModal
        title="Exclusão de perfil de permissão"
        description="Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
