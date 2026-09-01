'use client';

import { NotificationDetailDialog } from '@/components/notifications/notification-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/actions/notifications';
import { type Notification, useNotifications } from '@/lib/queries/notifications';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, AlertTriangle, Bell, CheckCheck, Info } from 'lucide-react';
import { useState } from 'react';

const LIST_LIMIT = 300;

const levelConfig = {
  INFO: { icon: Info, label: 'Info', className: 'text-sky-500' },
  WARNING: { icon: AlertTriangle, label: 'Aviso', className: 'text-amber-500' },
  CRITICAL: { icon: AlertCircle, label: 'Crítico', className: 'text-rose-500' },
};

export function NotificationsView() {
  const { notifications, unreadCount, refresh, isLoading } = useNotifications(LIST_LIMIT);
  const [selected, setSelected] = useState<Notification | null>(null);

  const handleOpenNotification = async (notification: Notification) => {
    setSelected(notification);
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      refresh();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    refresh();
  };

  const columns: ColumnDef<Notification>[] = [
    {
      id: 'level',
      header: '',
      cell: ({ row }) => {
        const config = levelConfig[row.original.level] || levelConfig.INFO;
        const Icon = config.icon;
        return <Icon className={`h-4 w-4 ${config.className}`} />;
      },
    },
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.title}</span>
          {!row.original.isRead && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'message',
      header: 'Mensagem',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1 text-sm">{row.original.message}</span>
      ),
    },
    {
      accessorKey: 'isRead',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isRead ? (
          <Badge variant="secondary">Lida</Badge>
        ) : (
          <Badge className="bg-sky-500/90 hover:bg-sky-500">Não lida</Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Data',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">Histórico completo de notificações da sua conta</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {!isLoading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bell className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Nenhuma notificação</h3>
          <p className="text-muted-foreground mt-2 text-center">
            Você ainda não recebeu nenhuma notificação.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={notifications}
          emptyMessage="Nenhuma notificação encontrada."
          onRowClick={handleOpenNotification}
        />
      )}

      <NotificationDetailDialog
        notification={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
