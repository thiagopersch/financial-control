'use client';

import { TestSendDialog } from '@/components/notification-templates/test-send-dialog';
import { ActionsDataTable } from '@/components/ui/actions-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { Switch } from '@/components/ui/switch';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import {
  deleteNotificationTemplate,
  toggleNotificationTemplate,
} from '@/lib/actions/notification-templates';
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notification-templates/labels';
import { hasPermission } from '@/lib/permissions/has-permission';
import type { NotificationTemplateDTO } from '@/lib/queries/notification-templates';
import type { WorkspaceUserOption } from '@/lib/queries/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface NotificationTemplatesListProps {
  templates: NotificationTemplateDTO[];
  users: WorkspaceUserOption[];
  onRefresh: () => void;
}

export function NotificationTemplatesList({
  templates,
  users,
  onRefresh,
}: NotificationTemplatesListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const canCreate = hasPermission(permissions, 'notification-templates', 'CREATE');
  const canUpdate = hasPermission(permissions, 'notification-templates', 'UPDATE');
  const canDelete = hasPermission(permissions, 'notification-templates', 'DELETE');

  const [testSendTarget, setTestSendTarget] = useState<NotificationTemplateDTO | null>(null);

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteNotificationTemplate, {
    successMessage: 'Template excluído com sucesso!',
    errorMessage: 'Não foi possível excluir o template!',
    onSuccess: onRefresh,
  });

  const [search, setSearch] = useState('');
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((template) => template.name.toLowerCase().includes(term));
  }, [templates, search]);

  const handleToggle = async (template: NotificationTemplateDTO) => {
    const result = await toggleNotificationTemplate(template.id, !template.isActive);
    if (result.success) {
      showSuccess('Template atualizado com sucesso!');
      onRefresh();
    } else {
      showError(result.error || 'Não foi possível atualizar o template!');
    }
  };

  const columns: ColumnDef<NotificationTemplateDTO>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => <span className="text-sm font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'channel',
      header: 'Canal',
      cell: ({ row }) => (
        <Badge variant="secondary" className="border-none text-xs">
          {NOTIFICATION_CHANNEL_LABELS[row.original.channel] || row.original.channel}
        </Badge>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {NOTIFICATION_TYPE_LABELS[row.original.type] || row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Ativo',
      cell: ({ row }) => {
        const template = row.original;
        return (
          <Switch
            checked={template.isActive}
            onCheckedChange={() => handleToggle(template)}
            disabled={!canUpdate}
          />
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Atualizado em',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm">
            {format(new Date(row.original.updatedAt), "dd 'de' MMM, yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
          <span className="text-muted-foreground text-xs">por {row.original.updatedByName}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const template = row.original;
        return (
          <ActionsDataTable
            row={row}
            onEdit={() => router.push(`/notification-templates/${template.id}`)}
            onDelete={() => handleDelete(template.id)}
            extraActions={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTestSendTarget(template)}
                className="h-8 w-8 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                title="Testar envio"
              >
                <Send className="h-4 w-4" />
              </Button>
            }
          />
        );
      },
    },
  ];

  const visibleColumns = columns.filter((col) => col.id !== 'actions' || canUpdate || canDelete);

  return (
    <div className="flex flex-col gap-4">
      <ListPageHeader
        title="Templates de Notificação"
        description="Crie templates de e-mail e WhatsApp para disparo automático de notificações."
        showFilterToggle={false}
        searchParams={searchParams}
        onSearch={setSearch}
        canCreate={canCreate}
        createLabel="Novo template"
        onCreate={() => router.push('/notification-templates/new')}
        paginationSlotRef={setPaginationSlot}
      />

      <DataTable
        columns={visibleColumns}
        data={filteredTemplates}
        emptyMessage="Nenhum template de notificação encontrado."
        paginationSlot={paginationSlot}
      />

      <DeleteConfirmModal
        title="Exclusão de template"
        description="Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      <TestSendDialog
        key={testSendTarget?.id ?? 'none'}
        template={testSendTarget}
        users={users}
        open={!!testSendTarget}
        onOpenChange={(open) => !open && setTestSendTarget(null)}
      />
    </div>
  );
}
