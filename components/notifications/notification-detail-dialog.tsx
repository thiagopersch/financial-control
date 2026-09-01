'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Notification } from '@/lib/queries/notifications';
import { formatFieldLabel, isIdLikeKey } from '@/lib/utils/field-labels';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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

function formatMetadataValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
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

interface NotificationDetailDialogProps {
  notification: Notification | null;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailDialog({
  notification,
  onOpenChange,
}: NotificationDetailDialogProps) {
  const router = useRouter();

  const handleGoToLink = () => {
    if (notification?.link) {
      router.push(notification.link);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={!!notification} onOpenChange={onOpenChange}>
      <DialogContent>
        {notification && (
          <>
            <DialogHeader>
              <DialogTitle>{notification.title}</DialogTitle>
              <DialogDescription>
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <p className="text-sm">{notification.message}</p>
              {notification.metadata &&
                typeof notification.metadata === 'object' &&
                Object.keys(notification.metadata).length > 0 && (
                  <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-xs">
                    {Object.entries(notification.metadata as Record<string, unknown>)
                      .filter(([key]) => !isIdLikeKey(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4">
                          <span className="text-muted-foreground">{formatFieldLabel(key)}</span>
                          <span className="font-medium">{formatMetadataValue(key, value)}</span>
                        </div>
                      ))}
                  </div>
                )}
            </DialogBody>
            {notification.link && (
              <Button onClick={handleGoToLink} className="w-full">
                Ver detalhes
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
