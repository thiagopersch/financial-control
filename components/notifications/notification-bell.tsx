'use client';

import { Button } from '@/components/ui/button';
import MuiBadge from '@mui/material/Badge';
import { NotificationDetailDialog } from '@/components/notifications/notification-detail-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { type Notification, useNotifications } from '@/lib/queries/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, AlertTriangle, Bell, CheckCheck, Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const levelConfig = {
  INFO: { icon: Info, className: 'text-[var(--mui-palette-info-main)]' },
  WARNING: { icon: AlertTriangle, className: 'text-[var(--mui-palette-pending-main)]' },
  CRITICAL: { icon: AlertCircle, className: 'text-[var(--mui-palette-overdue-main)]' },
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    hasMore,
    loadMore,
    isLoading,
    isLoadingMore,
    markRead,
    markAllRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  const handleLoadMore = () => loadMore();

  const handleOpenNotification = (notification: Notification) => {
    setSelected(notification);
    setOpen(false);
    if (!notification.isRead) void markRead(notification.id);
  };

  const handleMarkAllRead = () => void markAllRead();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            {/* Badge de contagem (MUI `Badge`): já é o componente Material para isso. */}
            <MuiBadge badgeContent={unreadCount} color="error" max={99} overlap="circular">
              <Bell className="h-5 w-5" />
            </MuiBadge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 p-0 max-[768px]:w-[calc(100vw-2rem)] max-[768px]:max-w-[calc(100vw-2rem)]"
        >
          <div className="flex items-center justify-between border-b p-3">
            <Link
              href="/notifications"
              className="text-sm font-semibold hover:underline"
              onClick={() => setOpen(false)}
            >
              Notificações
            </Link>
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
            {isLoading ? (
              <div
                className="flex flex-col gap-3 p-3"
                role="status"
                aria-label="Carregando notificações"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton variant="circular" className="h-4 w-4" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
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
                            <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
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
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Carregando...' : 'Ver mais'}
                  </Button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <NotificationDetailDialog
        notification={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
