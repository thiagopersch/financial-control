'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { REPORT_TYPE_LABELS } from '@/lib/notification-templates/default-report-templates';
import type { ScheduledEmailDTO } from '@/lib/queries/scheduled-emails-client';
import { formatInTimeZone } from '@/lib/services/email-schedule';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  BellRing,
  ChartColumnBig,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  FileText,
  History,
  Mail,
  MoreHorizontal,
  Pencil,
  Repeat,
  Send,
  Trash2,
  Users,
} from 'lucide-react';

const STATUS_META = {
  SENT: {
    label: 'Enviado',
    icon: CircleCheck,
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  SKIPPED: { label: 'Sem pendências', icon: CircleMinus, className: 'text-muted-foreground' },
  FAILED: { label: 'Falhou', icon: CircleAlert, className: 'text-destructive' },
} as const;

function contentSummary(item: ScheduledEmailDTO) {
  if (item.reportType === 'EXPENSE_SUMMARY') return `Últimos ${item.summaryPeriodDays} dias`;
  return [
    item.includeOverdueTransactions && 'Vencidas',
    item.includeOverdueInstallments && 'Parcelas em atraso',
    item.includeOpenDebts && 'Dívidas em aberto',
  ]
    .filter(Boolean)
    .join(' · ');
}

interface ScheduledEmailCardProps {
  item: ScheduledEmailDTO;
  index?: number;
  canUpdate: boolean;
  canDelete: boolean;
  isBusy?: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRunNow: () => void;
  onSendTest: () => void;
  onShowHistory: () => void;
}

export function ScheduledEmailCard({
  item,
  index = 0,
  canUpdate,
  canDelete,
  isBusy = false,
  onToggleActive,
  onEdit,
  onDelete,
  onRunNow,
  onSendTest,
  onShowHistory,
}: ScheduledEmailCardProps) {
  const isSummary = item.reportType === 'EXPENSE_SUMMARY';
  const TypeIcon = isSummary ? ChartColumnBig : BellRing;
  const status = item.lastStatus ? STATUS_META[item.lastStatus] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
      className="h-full"
    >
      <Card
        className={cn(
          'h-full gap-4 transition-shadow hover:shadow-md',
          !item.isActive && 'opacity-70',
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                item.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              <TypeIcon className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-base leading-tight" title={item.name}>
                {item.name}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{REPORT_TYPE_LABELS[item.reportType]}</Badge>
                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                  {item.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canUpdate && (
              <Switch
                checked={item.isActive}
                onCheckedChange={onToggleActive}
                aria-label={item.isActive ? 'Pausar envio' : 'Ativar envio'}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ações do agendamento">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && (
                  <DropdownMenuItem onClick={onRunNow} disabled={isBusy}>
                    <Send className="h-4 w-4" />
                    Enviar agora
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onSendTest} disabled={isBusy}>
                  <Mail className="h-4 w-4" />
                  Enviar teste para mim
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShowHistory}>
                  <History className="h-4 w-4" />
                  Histórico de envios
                </DropdownMenuItem>
                {canUpdate && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Repeat className="size-4 shrink-0" />
            <span className="text-foreground font-medium">{item.scheduleLabel}</span>
          </div>

          <div className="bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Send className="size-4" />
              Próximo envio
            </span>
            <span className="font-semibold tabular-nums">
              {item.isActive ? formatInTimeZone(item.nextRun, item.timezone) : 'Pausado'}
            </span>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0">
                <dt className="text-muted-foreground text-[11px] leading-tight">Conteúdo</dt>
                <dd className="truncate font-medium">
                  {contentSummary(item)} · {item.templateName ?? 'Modelo padrão'}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0">
                <dt className="text-muted-foreground text-[11px] leading-tight">Destinatários</dt>
                <dd className="truncate font-medium" title={item.toEmails.join(', ')}>
                  {item.toEmails.join(', ')}
                </dd>
                {item.ccEmails.length > 0 && (
                  <dd
                    className="text-muted-foreground truncate text-xs"
                    title={item.ccEmails.join(', ')}
                  >
                    Cc: {item.ccEmails.join(', ')}
                  </dd>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <History className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0">
                <dt className="text-muted-foreground text-[11px] leading-tight">Último envio</dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  {item.lastRun ? formatInTimeZone(item.lastRun, item.timezone) : 'Nunca'}
                  {status && (
                    <span
                      className={cn('flex items-center gap-1 text-xs', status.className)}
                      title={item.lastError ?? undefined}
                    >
                      <status.icon className="size-3.5" />
                      {status.label}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.div>
  );
}
