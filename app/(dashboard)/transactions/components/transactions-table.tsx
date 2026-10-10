'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { markTransactionAsPaid, toggleTransactionAutoMove } from '@/lib/actions/transactions';
import { cn } from '@/lib/utils';
import { formatCompetence, isSameCompetence } from '@/lib/utils/competence';
import { showError, showSuccess } from '@/lib/utils/toast';
import {
  getStaticTransactionSituation,
  getTransactionSituation,
  TRANSACTION_ROW_CLASSES,
  TRANSACTION_SITUATION_LEGEND,
} from '@/lib/utils/transaction-status';
import {
  Category,
  Supplier,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Edit,
  RepeatIcon,
  Trash,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DeleteConfirmModal } from './delete-confirm-modal';
import type { TransactionTotals } from '@/lib/utils/transaction-totals';
import { TransactionsTotals } from './transactions-totals';

type SerializedTransaction = Omit<Transaction, 'amount'> & {
  amount: number;
  category: Category;
  supplier: Supplier | null;
  account: any | null;
  paidBy: { id: string; name: string | null; email: string } | null;
  isRecurring: boolean;
  recurrenceType: string | null;
};

interface TransactionsTableProps {
  transactions: SerializedTransaction[];
  categories: Category[];
  suppliers: Supplier[];
  accounts: any[];
  costCenters?: { id: string; name: string }[];
  canModify?: boolean;
  totalCount: number;
  totals: TransactionTotals;
  page: number;
  pageSize: number;
  paginationSlot?: HTMLDivElement | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function SituacaoBadge({ transaction }: { transaction: SerializedTransaction }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true));
    return () => clearTimeout(timer);
  }, []);

  if (!mounted)
    return <div className="h-6 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />;

  if (transaction.type === TransactionType.INCOME) {
    return <div className="text-muted-foreground ml-4">--</div>;
  }

  if (transaction.status === TransactionStatus.PAID) {
    return (
      <div className="flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" />
        Em dia
      </div>
    );
  }

  const situation = getTransactionSituation(transaction);

  if (situation === 'DUE_TODAY') {
    return (
      <div className="flex w-fit items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5" />
        Vence Hoje
      </div>
    );
  }

  if (situation === 'OVERDUE') {
    return (
      <div className="flex w-fit animate-pulse items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
        <AlertCircle className="h-3.5 w-3.5" />
        Vencida
      </div>
    );
  }

  if (situation === 'DUE_TOMORROW') {
    return (
      <div className="flex w-fit items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        <Calendar className="h-3.5 w-3.5" />
        Vence Amanhã
      </div>
    );
  }

  return (
    <div className="flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
      <CheckCircle className="h-3.5 w-3.5" />
      Em dia
    </div>
  );
}

export function TransactionsTable({
  transactions,
  categories,
  suppliers,
  accounts,
  costCenters = [],
  canModify,
  totalCount,
  totals,
  page,
  pageSize,
  paginationSlot,
}: TransactionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingTransaction, setDeletingTransaction] = useState<SerializedTransaction | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMarkAsPaid = async (t: SerializedTransaction) => {
    setProcessingId(t.id);
    try {
      const result = await markTransactionAsPaid(t.id);
      if (result.success) {
        showSuccess(
          result.movedToCurrentMonth
            ? 'Transação marcada como paga e movida para o mês vigente.'
            : 'Transação marcada como paga.',
        );
        router.refresh();
      } else {
        showError(result.error || 'Erro ao marcar transação como paga.');
      }
    } catch {
      showError('Erro inesperado ao marcar transação como paga.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAutoMove = async (t: SerializedTransaction, checked: boolean) => {
    setProcessingId(t.id);
    try {
      const result = await toggleTransactionAutoMove(t.id, checked);
      if (result.success) {
        router.refresh();
      } else {
        showError(result.error || 'Erro ao atualizar transação.');
      }
    } catch {
      showError('Erro inesperado ao atualizar transação.');
    } finally {
      setProcessingId(null);
    }
  };

  const statusMap = {
    [TransactionStatus.PAID]: {
      label: 'Pago',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    [TransactionStatus.PENDING]: {
      label: 'Pendente',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    [TransactionStatus.OVERDUE]: {
      label: 'Atrasado',
      className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    },
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const initialColumns: ColumnDef<SerializedTransaction>[] = [
    {
      id: 'name',
      header: 'Nome',
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                t.type === TransactionType.INCOME
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-rose-100 dark:bg-rose-900/30',
              )}
            >
              {t.type === TransactionType.INCOME ? (
                <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {t.description || t.category.name}
                {t.isRecurring && (
                  <Tooltip>
                    <TooltipTrigger>
                      <RepeatIcon className="text-muted-foreground h-3 w-3 animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Transação recorrente</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {t.notes && (
                <div className="text-muted-foreground line-clamp-1 text-xs">{t.notes}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category.name',
      header: 'Categoria',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: row.original.category.color }}
          />
          {row.original.category.name}
        </div>
      ),
    },
    {
      accessorKey: 'account.name',
      header: 'Conta',
      cell: ({ row }) => {
        const acc = row.original.account;
        if (!acc) return '-';
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: acc.color || '#94a3b8' }}
            />
            {acc.name}
          </div>
        );
      },
    },
    {
      accessorKey: 'supplier.name',
      header: 'Fornecedor',
      cell: ({ row }) => row.original.supplier?.name || '-',
    },
    {
      accessorKey: 'date',
      header: 'Data de vencimento',
      cell: ({ row }) => {
        const t = row.original;

        if (t.type === TransactionType.INCOME && t.status === TransactionStatus.PENDING) {
          return <div className="text-muted-foreground ml-4">--</div>;
        }

        return (
          <div className="border-none text-sm whitespace-nowrap" suppressHydrationWarning>
            <div>{mounted ? format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'competence',
      header: 'Competência',
      cell: ({ row }) => {
        const t = row.original;
        const moved = !isSameCompetence(t.competence, t.originalCompetence);
        return (
          <div className="text-sm whitespace-nowrap tabular-nums">
            <div>{formatCompetence(t.competence)}</div>
            {moved && (
              <div className="text-muted-foreground text-xs">
                origem {formatCompetence(t.originalCompetence)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div
            className={cn(
              'text-sm font-bold whitespace-nowrap',
              t.type === TransactionType.INCOME
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(Number(t.amount))}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const t = row.original;
        const status = t.status;

        if (t.type === TransactionType.INCOME && status === TransactionStatus.PENDING) {
          return <div className="text-muted-foreground ml-4">--</div>;
        }

        return (
          <Badge variant="secondary" className={cn('border-none', statusMap[status].className)}>
            {statusMap[status].label}
          </Badge>
        );
      },
    },
    {
      id: 'situacao',
      header: 'Situação',
      cell: ({ row }) => <SituacaoBadge transaction={row.original} />,
    },
    {
      accessorKey: 'paidAt',
      header: 'Pago em',
      cell: ({ row }) => {
        const paidAt = row.original.paidAt;
        if (!paidAt) return <div className="text-muted-foreground">-</div>;
        return (
          <div className="text-sm whitespace-nowrap" suppressHydrationWarning>
            {mounted ? format(new Date(paidAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
          </div>
        );
      },
    },
    {
      id: 'paidBy',
      header: 'Pago por',
      cell: ({ row }) => {
        const paidBy = row.original.paidBy;
        if (!paidBy) return <div className="text-muted-foreground">-</div>;
        return <div className="text-sm whitespace-nowrap">{paidBy.name || paidBy.email}</div>;
      },
    },
    {
      id: 'autoMove',
      header: () => (
        <Tooltip>
          <TooltipTrigger className="cursor-default">Auto-mover</TooltipTrigger>
          <TooltipContent>
            <p>
              Quando marcado, transações pendentes/atrasadas de meses anteriores são movidas
              automaticamente para o mês vigente.
            </p>
          </TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const t = row.original;
        return (
          <Checkbox
            checked={t.autoMoveEnabled}
            disabled={processingId === t.id}
            onCheckedChange={(checked) => handleToggleAutoMove(t, checked === true)}
          />
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="space-x-1 text-right whitespace-nowrap">
            {t.status !== TransactionStatus.PAID && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkAsPaid(t)}
                    disabled={processingId === t.id}
                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Marcar como pago</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/transactions/${t.id}/edit`)}
              className="hover:bg-foreground/10 dark:hover:bg-foreground/10 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingTransaction(t)}
              className="h-8 w-8 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const columns = initialColumns.filter((col) => col.id !== 'actions' || canModify);

  // A situação depende do relógio do client; antes de montar usa só o status (evita mismatch).
  const getRowSituation = (t: SerializedTransaction) =>
    mounted && t.type === TransactionType.EXPENSE
      ? getTransactionSituation(t)
      : getStaticTransactionSituation(t);

  return (
    <div className="flex flex-col gap-4">
      {transactions.length > 0 && (
        <ul
          aria-label="Legenda de cores das linhas"
          className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
        >
          {TRANSACTION_SITUATION_LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', item.dotClassName)} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <DataTable
        columns={columns}
        data={transactions}
        emptyMessage="Nenhuma transação encontrada."
        getRowClassName={(transaction) =>
          transaction.id === deletingTransaction?.id
            ? 'bg-red-100/60 hover:bg-red-100/60 dark:bg-red-950/40'
            : TRANSACTION_ROW_CLASSES[getRowSituation(transaction)]
        }
        manualPagination={{
          page,
          pageSize,
          totalCount,
          onPageChange: (p) => updateParam('page', String(p)),
          onPageSizeChange: (size) => {
            const params = new URLSearchParams(searchParams);
            params.set('pageSize', String(size));
            params.set('page', '1');
            router.push(`${window.location.pathname}?${params.toString()}`);
          },
        }}
        paginationSlot={paginationSlot}
        footer={
          totalCount > 0 ? (
            <TableRow className="dark:bg-accent bg-slate-50/50 hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-3 whitespace-normal">
                <TransactionsTotals totals={totals} totalCount={totalCount} />
              </TableCell>
            </TableRow>
          ) : undefined
        }
      />

      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        id={deletingTransaction?.id || ''}
        isRecurring={deletingTransaction?.isRecurring || false}
        hasDebt={!!deletingTransaction?.debtId}
      />
    </div>
  );
}
