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
import type { ScheduledTransaction } from '@/lib/queries/scheduled';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarRange,
  CreditCard,
  FolderTree,
  Hash,
  Landmark,
  MoreHorizontal,
  Pencil,
  Play,
  Repeat,
  Tag,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
  BUSINESS_DAYS: 'Dias úteis',
  CUSTOM: 'Personalizada',
};

const WEEKDAY_LABELS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function frequencyDetail(item: ScheduledTransaction) {
  const label = FREQUENCY_LABELS[item.frequency] || item.frequency;
  if (item.frequency === 'MONTHLY' && item.dayOfMonth) return `${label} · dia ${item.dayOfMonth}`;
  if (item.frequency === 'WEEKLY' && item.dayOfWeek != null) {
    return `${label} · ${WEEKDAY_LABELS[item.dayOfWeek] ?? ''}`;
  }
  if (item.frequency === 'CUSTOM' && item.customDays.length > 0) {
    return `${label} · dias ${[...item.customDays].sort((a, b) => a - b).join(', ')}`;
  }
  return label;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });

function Detail({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-start gap-2', className)}>
      <span className="text-muted-foreground mt-0.5 shrink-0 [&_svg]:size-3.5">{icon}</span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-[11px] leading-tight">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

interface ScheduledCardProps {
  item: ScheduledTransaction;
  /** Nomes resolvidos a partir dos hooks SWR da página (o agendamento só guarda os IDs). */
  accountName?: string | null;
  paymentMethodName?: string | null;
  creditCardName?: string | null;
  costCenterName?: string | null;
  canUpdate?: boolean;
  isRunning?: boolean;
  index?: number;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRunNow: () => void;
}

export function ScheduledCard({
  item,
  accountName,
  paymentMethodName,
  creditCardName,
  costCenterName,
  canUpdate = true,
  isRunning = false,
  index = 0,
  onToggleActive,
  onEdit,
  onDelete,
  onRunNow,
}: ScheduledCardProps) {
  const isIncome = item.type === 'INCOME';
  const isLate = item.isActive && isBefore(new Date(item.nextRun), startOfDay(new Date()));
  const empty = <span className="text-muted-foreground font-normal">—</span>;

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
              <CalendarClock className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-base leading-tight" title={item.name}>
                {item.name}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'border-none',
                    isIncome
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                  )}
                >
                  {isIncome ? 'Receita' : 'Despesa'}
                </Badge>
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
                aria-label={item.isActive ? 'Pausar agendamento' : 'Ativar agendamento'}
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
                  <DropdownMenuItem onClick={onRunNow} disabled={isRunning}>
                    <Play className="h-4 w-4" />
                    Executar agora
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-2">
            <p
              className={cn(
                'text-2xl font-bold tabular-nums',
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
            </p>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Repeat className="size-3.5" />
              {frequencyDetail(item)}
            </span>
          </div>

          <div
            className={cn(
              'flex items-center justify-between rounded-md border px-3 py-2 text-sm',
              isLate
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
                : 'bg-muted/40',
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              Próxima execução
            </span>
            <span className="font-semibold tabular-nums">{formatDate(item.nextRun)}</span>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Detail icon={<Tag />} label="Categoria">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.category?.color || '#94a3b8' }}
                />
                <span className="truncate">{item.category?.name || '—'}</span>
              </span>
            </Detail>
            <Detail icon={<Building2 />} label="Fornecedor">
              {item.supplier?.name || empty}
            </Detail>
            <Detail icon={<Landmark />} label="Conta">
              {accountName || empty}
            </Detail>
            <Detail icon={<Wallet />} label="Meio de pagamento">
              {paymentMethodName || empty}
            </Detail>
            {item.creditCardId && (
              <Detail icon={<CreditCard />} label="Cartão">
                {creditCardName || empty}
              </Detail>
            )}
            <Detail icon={<CalendarRange />} label="Dia de vencimento">
              {item.dueDay ? `Dia ${item.dueDay}` : empty}
            </Detail>
            <Detail icon={<FolderTree />} label="Centro de custo">
              {costCenterName || empty}
            </Detail>
            <Detail icon={<CalendarCheck />} label="Última execução">
              {item.lastRun ? formatDate(item.lastRun) : <span className="font-normal">Nunca</span>}
            </Detail>
            <Detail icon={<Hash />} label="Transações geradas">
              <span className="tabular-nums">{item.generatedCount}</span>
            </Detail>
            <Detail icon={<CalendarPlus />} label="Criado em">
              {formatDate(item.createdAt)}
            </Detail>
          </dl>
        </CardContent>
      </Card>
    </motion.div>
  );
}
