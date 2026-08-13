'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/actions/notifications';
import { type Notification, useNotifications } from '@/lib/queries/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, AlertTriangle, Bell, CheckCheck, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const levelConfig = {
  INFO: { icon: Info, className: 'text-sky-500' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-500' },
  CRITICAL: { icon: AlertCircle, className: 'text-rose-500' },
};

const PAGE_SIZE = 30;

const CURRENCY_KEYS = new Set([
  'amount',
  'budgetAmount',
  'spentAmount',
  'current',
  'target',
  'used',
  'limit',
  'available',
  'topCategoryAmount',
]);

const metadataLabels: Record<string, string> = {
  name: 'Nome da transação',
  amount: 'Valor',
  dueDate: 'Data de vencimento',
  isRecurring: 'Recorrente',
  debtName: 'Vinculada à dívida',
  budgetAmount: 'Orçamento',
  spentAmount: 'Gasto',
  percentage: 'Percentual',
  current: 'Atual',
  target: 'Meta',
  used: 'Usado',
  limit: 'Limite',
  available: 'Disponível',
  cardName: 'Cartão',
  topCategory: 'Categoria que mais contribuiu',
  topCategoryAmount: 'Valor na categoria',
  closingDay: 'Dia de fechamento',
  dueDay: 'Dia de vencimento',
};

function formatMetadataValue(key: string, value: unknown): string {
  if (key === 'isRecurring') return value ? 'Sim' : 'Não';
  if (key === 'debtName') return typeof value === 'string' && value ? value : 'Não';
  if (value === null || value === undefined) return '—';
  if (key === 'dueDate' || key === 'date') {
    const date = new Date(value as string);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
  }
  if (CURRENCY_KEYS.has(key)) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (key === 'percentage') return `${Number(value).toFixed(0)}%`;
  return String(value);
}

export function NotificationBell() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { notifications, unreadCount, total, refresh, isLoading } = useNotifications(limit);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const router = useRouter();

  const hasMore = notifications.length < total;

  const handleLoadMore = () => {
    setLimit((prev) => prev + PAGE_SIZE);
  };

  const handleOpenNotification = async (notification: Notification) => {
    setSelected(notification);
    setOpen(false);
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      refresh();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    refresh();
  };

  const handleGoToLink = () => {
    if (selected?.link) {
      router.push(selected.link);
      setSelected(null);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 p-0 max-[768px]:w-[calc(100vw-2rem)] max-[768px]:max-w-[calc(100vw-2rem)]"
        >
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-semibold">Notificações</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto max-[768px]:max-h-[70vh]">
            {notifications.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                Nenhuma notificação por aqui.
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const config = levelConfig[notification.level] || levelConfig.INFO;
                  const Icon = config.icon;
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleOpenNotification(notification)}
                      className={cn(
                        'hover:bg-accent flex w-full cursor-pointer items-start gap-2.5 border-b p-3 text-left transition-colors last:border-b-0',
                        !notification.isRead && 'bg-accent/40',
                      )}
                    >
                      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.className)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{notification.title}</p>
                          {!notification.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                          )}
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {notification.message}
                        </p>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-none text-xs"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Carregando...' : 'Ver mais'}
                  </Button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {formatDistanceToNow(new Date(selected.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm">{selected.message}</p>
              {selected.metadata && (
                <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-xs">
                  {Object.entries(selected.metadata)
                    .filter(([key]) => !/Id$/i.test(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{metadataLabels[key] || key}</span>
                        <span className="font-medium">{formatMetadataValue(key, value)}</span>
                      </div>
                    ))}
                </div>
              )}
              {selected.link && (
                <Button onClick={handleGoToLink} className="w-full">
                  Ver detalhes
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
