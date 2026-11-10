'use client';

import Box from '@mui/material/Box';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ActionsDataTable } from '@/components/ui/actions-data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { markTransactionAsPaid, toggleTransactionAutoMove } from '@/lib/actions/transactions';
import { cn } from '@/lib/utils';
import { formatCompetence, isSameCompetence } from '@/lib/utils/competence';
import { showError, showSuccess } from '@/lib/utils/toast';
import {
  getStaticTransactionSituation,
  getTransactionRowSx,
  getTransactionSituation,
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
  Clock,
  RepeatIcon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore, useOptimistic, useTransition } from 'react';
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

/**
 * A situação depende do horário atual: até a tabela hidratar mostra um
 * placeholder. `mounted` vem da tabela (um único estado), não de um efeito por
 * linha — antes cada linha renderizava duas vezes.
 */
const subscribeNoop = () => () => {};

function SituacaoBadge({
  transaction,
  mounted,
}: {
  transaction: SerializedTransaction;
  mounted: boolean;
}) {
  if (!mounted) return <Skeleton className="h-6 w-16" />;

  if (transaction.type === TransactionType.INCOME) {
    return <div className="text-muted-foreground ml-4">--</div>;
  }

  if (transaction.status === TransactionStatus.PAID) {
    return (
      <Badge variant="paid" icon={<CheckCircle className="h-3.5 w-3.5" />}>
        Em dia
      </Badge>
    );
  }

  const situation = getTransactionSituation(transaction);

  if (situation === 'DUE_TODAY') {
    return (
      <Badge variant="dueSoon" icon={<Clock className="h-3.5 w-3.5" />}>
        Vence Hoje
      </Badge>
    );
  }

  if (situation === 'OVERDUE') {
    return (
      <Badge
        variant="overdue"
        className="animate-pulse"
        icon={<AlertCircle className="h-3.5 w-3.5" />}
      >
        Vencida
      </Badge>
    );
  }

  if (situation === 'DUE_TOMORROW') {
    return (
      <Badge variant="dueSoon" icon={<Calendar className="h-3.5 w-3.5" />}>
        Vence Amanhã
      </Badge>
    );
  }

  return (
    <Badge variant="paid" icon={<CheckCircle className="h-3.5 w-3.5" />}>
      Em dia
    </Badge>
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
  // `true` só no client após hidratar (datas/situação dependem do fuso e do horário atual).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  // UI otimista: a linha muda na hora; se a action falhar, o React volta ao estado do servidor.
  const [, startOptimistic] = useTransition();
  const [optimisticTransactions, applyOptimistic] = useOptimistic(
    transactions,
    (state, patch: { id: string } & Partial<SerializedTransaction>) =>
      state.map((t) => (t.id === patch.id ? { ...t, ...patch } : t)),
  );

  const handleMarkAsPaid = (t: SerializedTransaction) =>
    startOptimistic(async () => {
      applyOptimistic({ id: t.id, status: TransactionStatus.PAID });
      await markAsPaid(t);
    });

  const markAsPaid = async (t: SerializedTransaction) => {
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

  const handleToggleAutoMove = (t: SerializedTransaction, checked: boolean) =>
    startOptimistic(async () => {
      applyOptimistic({ id: t.id, autoMoveEnabled: checked } as never);
      await toggleAutoMove(t, checked);
    });

  const toggleAutoMove = async (t: SerializedTransaction, checked: boolean) => {
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
    [TransactionStatus.PAID]: { label: 'Pago', color: 'paid' as const },
    [TransactionStatus.PENDING]: { label: 'Pendente', color: 'pending' as const },
    [TransactionStatus.OVERDUE]: { label: 'Atrasado', color: 'overdue' as const },
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
            <Box
              className="p-2"
              sx={{
                borderRadius: 2,
                bgcolor: `rgba(var(--mui-palette-${
                  t.type === TransactionType.INCOME ? 'income' : 'expense'
                }-mainChannel) / 0.14)`,
                color: t.type === TransactionType.INCOME ? 'income.main' : 'expense.main',
                display: 'flex',
              }}
            >
              {t.type === TransactionType.INCOME ? (
                <ArrowUpCircle className="h-4 w-4" />
              ) : (
                <ArrowDownCircle className="h-4 w-4" />
              )}
            </Box>
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
          <div className="text-sm whitespace-nowrap" suppressHydrationWarning>
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
          <Box
            className="text-sm font-bold whitespace-nowrap"
            sx={{ color: t.type === TransactionType.INCOME ? 'income.main' : 'expense.main' }}
          >
            {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(Number(t.amount))}
          </Box>
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

        return <Badge variant={statusMap[status].color}>{statusMap[status].label}</Badge>;
      },
    },
    {
      id: 'situacao',
      header: 'Situação',
      cell: ({ row }) => <SituacaoBadge transaction={row.original} mounted={mounted} />,
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
          <ActionsDataTable
            row={row}
            onMarkAsPaid={t.status !== TransactionStatus.PAID ? handleMarkAsPaid : undefined}
            disabledMarkAsPaid={processingId === t.id}
            onEdit={() => router.push(`/transactions/${t.id}/edit`)}
            onDelete={() => setDeletingTransaction(t)}
          />
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
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: `${item.role}.main`,
                }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <DataTable
        columns={columns}
        data={optimisticTransactions}
        emptyMessage="Nenhuma transação encontrada."
        getRowSx={(transaction) =>
          transaction.id === deletingTransaction?.id
            ? { bgcolor: 'rgba(var(--mui-palette-error-mainChannel) / 0.12)' }
            : getTransactionRowSx(getRowSituation(transaction))
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
            <TransactionsTotals totals={totals} totalCount={totalCount} />
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
