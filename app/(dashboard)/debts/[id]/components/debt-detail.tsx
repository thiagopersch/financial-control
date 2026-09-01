'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { DEBT_STATUS_BADGE_VARIANT, DEBT_STATUS_LABELS } from '@/lib/constants/debt-status';
import type { DebtDTO } from '@/lib/queries/debts';
import type { DebtTransactionDTO } from '@/lib/queries/transactions';
import { cn, formatCurrency } from '@/lib/utils';
import { TransactionStatus } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DebtDetailProps {
  debt: DebtDTO;
  transactions: DebtTransactionDTO[];
}

const statusMap: Record<TransactionStatus, { label: string; className: string }> = {
  PAID: {
    label: 'Pago',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Pendente',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  OVERDUE: {
    label: 'Atrasado',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

const columns: ColumnDef<DebtTransactionDTO>[] = [
  {
    accessorKey: 'description',
    header: 'Descrição',
    cell: ({ row }) => row.original.description || '-',
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoria',
    cell: ({ row }) =>
      row.original.categoryName ? (
        <div className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: row.original.categoryColor || '#94a3b8' }}
          />
          {row.original.categoryName}
        </div>
      ) : (
        '-'
      ),
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => format(new Date(row.original.date), 'dd/MM/yyyy', { locale: ptBR }),
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    cell: ({ row }) => (
      <span className="font-medium text-rose-600 dark:text-rose-400">
        {formatCurrency(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant="secondary" className={cn('border-none', statusMap[status].className)}>
          {statusMap[status].label}
        </Badge>
      );
    },
  },
];

export function DebtDetail({ debt, transactions }: DebtDetailProps) {
  const router = useRouter();
  const debtPaid = debt.initialValue - debt.currentValue;
  const debtPercentage = debt.initialValue > 0 ? (debtPaid / debt.initialValue) * 100 : 0;

  return (
    <div className="mx-auto w-[90%] space-y-6">
      <Button type="button" variant="ghost" className="gap-2" onClick={() => router.push('/debts')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{debt.name}</CardTitle>
            <Badge variant={DEBT_STATUS_BADGE_VARIANT[debt.status]}>
              {DEBT_STATUS_LABELS[debt.status]}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {debt.description && (
              <p className="text-muted-foreground pb-2 text-sm">{debt.description}</p>
            )}
            {(debt.accountName || debt.supplierName || debt.categoryName || debt.paymentMethodName) && (
              <div className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 border-b pb-2 text-xs">
                {debt.accountName && (
                  <span>
                    Conta: <span className="text-foreground font-medium">{debt.accountName}</span>
                  </span>
                )}
                {debt.supplierName && (
                  <span>
                    Fornecedor:{' '}
                    <span className="text-foreground font-medium">{debt.supplierName}</span>
                  </span>
                )}
                {debt.categoryName && (
                  <span>
                    Categoria:{' '}
                    <span className="text-foreground font-medium">{debt.categoryName}</span>
                  </span>
                )}
                {debt.paymentMethodName && (
                  <span>
                    Pagamento:{' '}
                    <span className="text-foreground font-medium">{debt.paymentMethodName}</span>
                  </span>
                )}
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="font-medium">{formatCurrency(debt.initialValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Falta Pagar:</span>
              <span className="font-medium text-red-500">{formatCurrency(debt.currentValue)}</span>
            </div>
            {debt.interestRate != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Juros:</span>
                <span className="font-medium">{debt.interestRate}%</span>
              </div>
            )}
            {debt.dueDay && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencimento:</span>
                <span className="font-medium">Dia {debt.dueDay}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{debtPercentage.toFixed(1)}%</div>
            <Progress value={debtPercentage} />
            {debt.installments != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcelas:</span>
                <span className="font-medium">
                  {debt.installments - (debt.remainingInstallments ?? debt.installments)}/
                  {debt.installments} pagas
                </span>
              </div>
            )}
            {debt.installmentValue != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor da Parcela:</span>
                <span className="font-medium">{formatCurrency(debt.installmentValue)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transações vinculadas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            emptyMessage="Nenhuma transação vinculada a esta dívida."
          />
        </CardContent>
      </Card>
    </div>
  );
}
