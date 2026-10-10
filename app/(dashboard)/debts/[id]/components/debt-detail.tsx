'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { DEBT_STATUS_BADGE_VARIANT, DEBT_STATUS_LABELS } from '@/lib/constants/debt-status';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { CategoryDTO } from '@/lib/queries/categories';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import type { DebtDTO } from '@/lib/queries/debts';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import type { DebtTransactionDTO } from '@/lib/queries/transactions';
import { formatCurrency } from '@/lib/utils';
import { PERIODICITY_LABELS } from '@/lib/constants/periodicity';
import { Periodicity, TransactionStatus } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { InstallmentEditDialog } from './installment-edit-dialog';
import { InstallmentStatusMenu } from './installment-status-menu';

interface DebtDetailProps {
  debt: DebtDTO;
  transactions: DebtTransactionDTO[];
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  paymentMethods: PaymentMethodDTO[];
  creditCards: CreditCardDTO[];
}

export function DebtDetail({
  debt,
  transactions,
  accounts,
  categories,
  paymentMethods,
  creditCards,
}: DebtDetailProps) {
  const router = useRouter();
  const [selectedTransaction, setSelectedTransaction] = useState<DebtTransactionDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debtPaid = debt.initialValue - debt.currentValue;
  const debtPercentage = debt.initialValue > 0 ? (debtPaid / debt.initialValue) * 100 : 0;
  const paidInstallments = transactions.filter((t) => t.status === TransactionStatus.PAID).length;
  const debtPeriodicity =
    debt.periodicity || (debt.installments && debt.installments > 1 ? Periodicity.MONTHLY : null);
  const periodicityLabel = debtPeriodicity
    ? PERIODICITY_LABELS[debtPeriodicity as Periodicity]
    : null;

  const openEditDialog = (transaction: DebtTransactionDTO) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
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
      cell: ({ row }) => <InstallmentStatusMenu transaction={row.original} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => openEditDialog(row.original)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar parcela</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto w-[90%] space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          onClick={() => router.push('/debts')}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => router.push(`/debts/${debt.id}/edit`)}
        >
          <Pencil className="h-4 w-4" />
          Editar dívida
        </Button>
      </div>

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
            {(debt.accountName ||
              debt.supplierName ||
              debt.categoryName ||
              debt.paymentMethodName) && (
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
              <span className="text-muted-foreground">Já pago:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(debtPaid)}
              </span>
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
            {debt.firstInstallmentDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Primeira parcela:</span>
                <span className="font-medium">
                  {format(new Date(debt.firstInstallmentDate), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            {periodicityLabel && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repetição:</span>
                <span className="font-medium">{periodicityLabel}</span>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor pago:</span>
              <span className="font-medium">{formatCurrency(debtPaid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor restante:</span>
              <span className="font-medium text-red-500">{formatCurrency(debt.currentValue)}</span>
            </div>
            {debt.installments != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcelas:</span>
                <span className="font-medium">
                  {paidInstallments}/{debt.installments} pagas
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Parcelas</CardTitle>
          <span className="text-muted-foreground text-sm">
            {paidInstallments} de {transactions.length} pagas
          </span>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            emptyMessage="Nenhuma parcela vinculada a esta dívida."
          />
        </CardContent>
      </Card>

      <InstallmentEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
        debt={debt}
        accounts={accounts}
        categories={categories}
        paymentMethods={paymentMethods}
        creditCards={creditCards}
      />
    </div>
  );
}
