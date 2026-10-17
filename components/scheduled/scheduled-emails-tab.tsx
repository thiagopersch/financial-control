'use client';

import { ScheduledEmailCard } from '@/components/scheduled/scheduled-email-card';
import { ScheduledEmailFormDialog } from '@/components/scheduled/scheduled-email-form-dialog';
import { ScheduledEmailLogsDialog } from '@/components/scheduled/scheduled-email-logs-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { ListPagination } from '@/components/ui/list-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { useScheduledEmails } from '@/hooks/use-scheduled-emails';
import {
  deleteScheduledEmail,
  runScheduledEmailNow,
  sendScheduledEmailPreview,
  toggleScheduledEmail,
} from '@/lib/actions/scheduled-emails';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';
import { hasPermission } from '@/lib/permissions/has-permission';
import type { ScheduledEmailDTO } from '@/lib/queries/scheduled-emails-client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { MailPlus, Send, TriangleAlert } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export function ScheduledEmailsTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledEmailDTO | null>(null);
  const [historyFor, setHistoryFor] = useState<ScheduledEmailDTO | null>(null);
  const [runningItem, setRunningItem] = useState<ScheduledEmailDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const canCreate = hasPermission(permissions, 'scheduled', 'CREATE');
  const canUpdate = hasPermission(permissions, 'scheduled', 'UPDATE');
  const canDelete = hasPermission(permissions, 'scheduled', 'DELETE');

  const { scheduledEmails, total, smtpConfigured, isLoading, refresh } = useScheduledEmails(
    page,
    pageSize,
  );

  const {
    isOpen: isDeleteOpen,
    requestDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteScheduledEmail, {
    successMessage: 'Agendamento excluído',
    errorMessage: 'Erro ao excluir agendamento',
    onSuccess: () => refresh(),
  });

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    return params;
  }, [search]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return scheduledEmails;
    return scheduledEmails.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        [...s.toEmails, ...s.ccEmails].some((e) => e.includes(term)),
    );
  }, [scheduledEmails, search]);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const runAction = async (
    item: ScheduledEmailDTO,
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    setBusyId(item.id);
    try {
      const result = await action();
      if (result.success) showSuccess(successMessage);
      else showError(result.error || 'Erro ao executar ação');
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const confirmRunNow = async () => {
    if (!runningItem) return;
    await runAction(runningItem, () => runScheduledEmailNow(runningItem.id), 'E-mail enviado');
    setRunningItem(null);
  };

  return (
    <div className="space-y-6">
      <ListPageHeader
        searchParams={searchParams}
        onSearch={setSearch}
        showFilterToggle={false}
        canCreate={canCreate}
        createLabel="Novo e-mail agendado"
        onCreate={openCreate}
        paginationSlotRef={setPaginationSlot}
      />

      {!isLoading && !smtpConfigured && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>SMTP não configurado</AlertTitle>
          <AlertDescription>
            <p>
              Os e-mails agendados não serão enviados até que o servidor de e-mail seja configurado
              em{' '}
              <Link href="/system-settings" className="underline">
                Configurações do sistema
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-9 w-full" />
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-8" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MailPlus className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum e-mail agendado</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              {scheduledEmails.length === 0
                ? 'Agende lembretes de transações vencidas, parcelas em atraso e dívidas em aberto, ou um resumo semanal das despesas com gráficos.'
                : 'Nenhum agendamento corresponde à busca.'}
            </p>
            {canCreate && scheduledEmails.length === 0 && (
              <Button className="mt-4" onClick={openCreate}>
                <MailPlus className="h-4 w-4" />
                Agendar e-mail
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => (
            <ScheduledEmailCard
              key={item.id}
              item={item}
              index={index}
              canUpdate={canUpdate}
              canDelete={canDelete}
              isBusy={busyId === item.id}
              onToggleActive={() =>
                runAction(
                  item,
                  () => toggleScheduledEmail(item.id, !item.isActive),
                  item.isActive ? 'Envio pausado' : 'Envio ativado',
                )
              }
              onEdit={() => {
                setEditing(item);
                setIsFormOpen(true);
              }}
              onDelete={() => requestDelete(item.id)}
              onRunNow={() => setRunningItem(item)}
              onSendTest={() =>
                runAction(
                  item,
                  () => sendScheduledEmailPreview(item.id),
                  `Teste enviado para ${session?.user?.email ?? 'você'}`,
                )
              }
              onShowHistory={() => setHistoryFor(item)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalCount={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          paginationSlot={paginationSlot}
        />
      )}

      {isFormOpen && (
        <ScheduledEmailFormDialog
          key={editing?.id ?? 'new'}
          isOpen={isFormOpen}
          editing={editing}
          currentUserEmail={session?.user?.email}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          onSaved={() => refresh()}
        />
      )}

      <ScheduledEmailLogsDialog schedule={historyFor} onClose={() => setHistoryFor(null)} />

      <AlertDialog
        open={!!runningItem}
        onOpenChange={(open) => {
          if (!open && !busyId) setRunningItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar e-mail agora?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{runningItem?.name}&quot; será enviado agora para{' '}
              {runningItem?.toEmails.join(', ')}
              {runningItem?.ccEmails.length ? ` (Cc: ${runningItem.ccEmails.join(', ')})` : ''}. O
              próximo envio programado não muda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Cancelar</AlertDialogCancel>
            <Button onClick={confirmRunNow} disabled={!!busyId}>
              <Send className="h-4 w-4" />
              {busyId ? 'Enviando...' : 'Enviar agora'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmModal
        title="Excluir e-mail agendado"
        description="Tem certeza que deseja excluir este agendamento? O histórico de envios também será removido."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
