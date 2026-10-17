'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useScheduledEmailLogs } from '@/hooks/use-scheduled-emails';
import type { ScheduledEmailDTO } from '@/lib/queries/scheduled-emails-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History } from 'lucide-react';
import { useState } from 'react';

const PAGE_SIZE = 10;

const STATUS_BADGE = {
  SENT: { label: 'Enviado', variant: 'default' },
  SKIPPED: { label: 'Sem pendências', variant: 'secondary' },
  FAILED: { label: 'Falhou', variant: 'destructive' },
} as const;

export function ScheduledEmailLogsDialog({
  schedule,
  onClose,
}: {
  schedule: ScheduledEmailDTO | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { logs, total, isLoading } = useScheduledEmailLogs(schedule?.id ?? null, page, PAGE_SIZE);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <Dialog
      open={!!schedule}
      onOpenChange={(open) => {
        if (!open) {
          setPage(1);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de envios</DialogTitle>
          <DialogDescription>{schedule?.name}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : logs.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center py-10 text-sm">
              <History className="mb-3 size-10" />
              Nenhum envio registrado ainda.
            </div>
          ) : (
            logs.map((log) => {
              const badge = STATUS_BADGE[log.status];
              return (
                <div key={log.id} className="space-y-1 rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">
                      {format(new Date(log.sentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <div className="flex gap-1">
                      {log.manual && <Badge variant="outline">Manual</Badge>}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                  {log.subject && <p className="truncate">{log.subject}</p>}
                  <p className="text-muted-foreground truncate text-xs">
                    {log.recipients.join(', ')} · {log.itemsCount} item(ns)
                  </p>
                  {log.error && <p className="text-destructive text-xs">{log.error}</p>}
                </div>
              );
            })
          )}
        </DialogBody>
        {pages > 1 && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-muted-foreground">
              {page} de {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
