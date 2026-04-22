'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Category,
  Supplier,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  RepeatIcon,
  Trash,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DeleteConfirmModal } from './delete-confirm-modal';
import { TransactionModal } from './transaction-modal';

type SerializedTransaction = Omit<Transaction, 'amount'> & {
  amount: number;
  category: Category;
  supplier: Supplier | null;
  account: any | null;
  isRecurring: boolean;
  recurrenceType: string | null;
};

interface TransactionsTableProps {
  transactions: SerializedTransaction[];
  categories: Category[];
  suppliers: Supplier[];
  accounts: any[];
  userRole?: string;
}

function OverdueBadge({ transaction }: { transaction: SerializedTransaction }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(transaction.dueDate || transaction.date));

  if (isToday(dueDate)) {
    return (
      <div className="flex w-fit items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5" />
        Vence Hoje
      </div>
    );
  }

  if (dueDate < today) {
    return (
      <div className="flex w-fit animate-pulse items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
        <AlertCircle className="h-3.5 w-3.5" />
        Vencida
      </div>
    );
  }

  if (isTomorrow(dueDate)) {
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
  userRole,
}: TransactionsTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<SerializedTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const initialColumns: ColumnDef<SerializedTransaction>[] = [
    {
      accessorKey: 'category.name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
          >
            Descrição / Categoria
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
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
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: t.category.color }}
                />
                {t.category.name}
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
      sortingFn: (rowA, rowB) => {
        return rowA.original.category.name.localeCompare(rowB.original.category.name);
      },
    },
    {
      accessorKey: 'supplier.name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Fornecedor
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => row.original.supplier?.name || '-',
    },
    {
      accessorKey: 'date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Data de vencimento
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const t = row.original;

        if (t.type === TransactionType.INCOME && t.status === TransactionStatus.PENDING) {
          return <div className="text-muted-foreground ml-4">--</div>;
        }

        return (
          <div className="border-none text-sm whitespace-nowrap" suppressHydrationWarning>
            <div>{mounted ? format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</div>
            {t.dueDate && mounted && (
              <div className="text-muted-foreground text-xs">
                Vence em: {format(new Date(t.dueDate), 'dd/MM/yyyy')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'account.name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Conta
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
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
      accessorKey: 'amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Valor
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row, column }) => {
        const t = row.original;
        return (
          <div
            className={cn(
              'text-sm font-bold',
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Status
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
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
      id: 'overdue',
      header: 'Atraso',
      cell: ({ row }) => <OverdueBadge transaction={row.original} />,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="space-x-1 text-right whitespace-nowrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTransaction(t)}
              className="hover:bg-foreground/10 dark:hover:bg-foreground/10 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingId(t.id)}
              className="h-8 w-8 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const columns = initialColumns.filter((col) => col.id !== 'actions' || userRole !== 'VIEWER');

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={transactions}
        emptyMessage="Nenhuma transação encontrada."
        getRowClassName={(transaction) =>
          transaction.id === deletingId ? 'bg-red-50/30 dark:bg-red-950/10' : ''
        }
      />

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        initialData={editingTransaction}
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
      />

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        id={deletingId || ''}
      />
    </div>
  );
}
