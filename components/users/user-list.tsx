'use client';

import { ActionsDataTable } from '@/components/ui/actions-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/switch';
import { toggleUserActive } from '@/lib/actions/users';
import { hasPermission } from '@/lib/permissions/has-permission';
import { cn } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { PermissionProfile, User } from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpDown, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DeleteUserModal } from './delete-user-modal';
import { UserModal } from './user-modal';
import { UsersHeader } from './users-header';

type UserWithPermissionProfile = User & { permissionProfile: PermissionProfile | null };

interface UserListProps {
  users: UserWithPermissionProfile[];
  currentUserId: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const canCreate = hasPermission(permissions, 'users', 'CREATE');
  const canUpdate = hasPermission(permissions, 'users', 'UPDATE');
  const canDelete = hasPermission(permissions, 'users', 'DELETE');

  const [editingUser, setEditingUser] = useState<UserWithPermissionProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  const handleToggleActive = async (user: UserWithPermissionProfile, isActive: boolean) => {
    setTogglingId(user.id);
    try {
      const result = await toggleUserActive(user.id, isActive);
      if (result.success) {
        showSuccess(isActive ? 'Usuário ativado.' : 'Usuário desativado.');
        router.refresh();
      } else {
        showError(result.error || 'Erro ao atualizar usuário.');
      }
    } catch {
      showError('Erro inesperado ao atualizar usuário.');
    } finally {
      setTogglingId(null);
    }
  };

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        (user.name || '').toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
    );
  }, [users, search]);

  const initialColumns: ColumnDef<UserWithPermissionProfile>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Usuário
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentUserId;
        return (
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-semibold">{user.name || '—'}</span>
              {isSelf && <span className="text-muted-foreground ml-2 text-xs">(você)</span>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          E-mail
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'permissionProfile',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Perfil de Permissão
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const profile = row.original.permissionProfile;
        if (!profile) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <Badge
            variant="secondary"
            className="gap-1 border-none bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
          >
            {profile.isSystem && <ShieldCheck className="h-3 w-3" />}
            {profile.name}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentUserId;
        return (
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Switch
                checked={user.isActive}
                disabled={togglingId === user.id || (isSelf && user.isActive)}
                onCheckedChange={(checked) => handleToggleActive(user, checked)}
                aria-label={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
              />
            )}
            <Badge
              variant="secondary"
              className={cn(
                'border-none',
                user.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {user.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Membro desde
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
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
        const user = row.original;
        const isSelf = user.id === currentUserId;
        return (
          <ActionsDataTable
            row={row}
            onEdit={() => setEditingUser(user)}
            onDelete={() => setDeletingId(user.id)}
            disabledDelete={isSelf}
          />
        );
      },
    },
  ];

  const columns = initialColumns.filter((col) => col.id !== 'actions' || canUpdate || canDelete);

  return (
    <div className="flex flex-col gap-4">
      <UsersHeader
        canCreate={canCreate}
        onCreate={() => setIsCreateOpen(true)}
        searchParams={searchParams}
        onSearch={setSearch}
        paginationSlotRef={setPaginationSlot}
      />

      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyMessage="Nenhum usuário encontrado."
        getRowClassName={(user) =>
          cn(
            user.id === currentUserId && 'bg-primary/10 dark:bg-primary/5',
            !user.isActive && 'text-muted-foreground opacity-70',
          )
        }
        paginationSlot={paginationSlot}
      />

      <UserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <UserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        initialData={editingUser}
      />
      <DeleteUserModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        id={deletingId || ''}
      />
    </div>
  );
}
