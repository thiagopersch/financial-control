'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Category, Supplier, TransactionStatus, TransactionType } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  description?: string | null;
  notes: string | null;
  status: TransactionStatus;
  category: Category;
  supplier: Supplier | null;
  account?: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: TransactionRow[];
}

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="col-span-full overflow-hidden border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Nenhuma transação encontrada.
          </p>
        ) : (
          <div className="divide-y">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'shrink-0 rounded-lg p-2',
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
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {t.description || t.category.name}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {t.category.name}
                      {t.supplier?.name ? ` · ${t.supplier.name}` : ''}
                      {t.account?.name ? ` · ${t.account.name}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-11 sm:ml-auto sm:pl-0">
                  <div
                    className="text-muted-foreground text-xs whitespace-nowrap"
                    suppressHydrationWarning
                  >
                    {format(new Date(t.date), "dd 'de' MMM", { locale: ptBR })}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn('border-none', statusMap[t.status].className)}
                  >
                    {statusMap[t.status].label}
                  </Badge>
                  <div
                    className={cn(
                      'ml-auto shrink-0 text-right text-sm font-bold whitespace-nowrap sm:ml-0 sm:w-28',
                      t.type === TransactionType.INCOME
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {t.type === TransactionType.INCOME ? '+' : '-'}{' '}
                    {formatCurrency(Number(t.amount))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
