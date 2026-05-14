'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Category, Supplier, TransactionType, TransactionStatus } from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  notes: string | null;
  status: TransactionStatus;
  category: Category;
  supplier: Supplier | null;
}

interface RecentTransactionsProps {
  transactions: TransactionRow[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
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

  const columns: ColumnDef<TransactionRow>[] = [
    {
      accessorKey: 'category.name',
      header: 'Descrição / Categoria',
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
              <div className="text-sm font-semibold">{t.category.name}</div>
              {t.notes && (
                <div className="text-muted-foreground line-clamp-1 text-xs">{t.notes}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => (
        <div className="text-sm" suppressHydrationWarning>
          {format(new Date(row.original.date), "dd 'de' MMM", { locale: ptBR })}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => {
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
      header: 'Status',
      cell: ({ row }) => {
        const t = row.original;
        return (
          <Badge variant="secondary" className={cn('border-none', statusMap[t.status].className)}>
            {statusMap[t.status].label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'supplier.name',
      header: 'Fornecedor',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.supplier?.name || '-'}</span>
      ),
    },
  ];

  return (
    <Card className="col-span-full overflow-hidden border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <DataTable
          columns={columns}
          data={transactions}
          emptyMessage="Nenhuma transação encontrada."
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
}
