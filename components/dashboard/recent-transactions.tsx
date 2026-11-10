'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Box from '@mui/material/Box';
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
  [TransactionStatus.PAID]: { label: 'Pago', color: 'paid' as const },
  [TransactionStatus.PENDING]: { label: 'Pendente', color: 'pending' as const },
  [TransactionStatus.OVERDUE]: { label: 'Atrasado', color: 'overdue' as const },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="col-span-full overflow-hidden">
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
                  <Box
                    className="shrink-0 p-2"
                    sx={{
                      borderRadius: 2,
                      display: 'flex',
                      bgcolor: `rgba(var(--mui-palette-${
                        t.type === TransactionType.INCOME ? 'income' : 'expense'
                      }-mainChannel) / 0.14)`,
                      color: t.type === TransactionType.INCOME ? 'income.main' : 'expense.main',
                    }}
                  >
                    {t.type === TransactionType.INCOME ? (
                      <ArrowUpCircle className="h-4 w-4" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" />
                    )}
                  </Box>
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
                  <Badge variant={statusMap[t.status].color}>{statusMap[t.status].label}</Badge>
                  <Box
                    className="ml-auto shrink-0 text-right text-sm font-bold whitespace-nowrap sm:ml-0 sm:w-28"
                    sx={{
                      color: t.type === TransactionType.INCOME ? 'income.main' : 'expense.main',
                    }}
                  >
                    {t.type === TransactionType.INCOME ? '+' : '-'}{' '}
                    {formatCurrency(Number(t.amount))}
                  </Box>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
