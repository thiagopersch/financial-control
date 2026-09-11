'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PERIODICITY_LABELS } from '@/lib/constants/periodicity';
import type { DebtDTO } from '@/lib/queries/debts';
import { calculateInstallmentPreview } from '@/lib/utils/debt-preview';
import { formatCurrency } from '@/lib/utils';
import { Periodicity, TransactionStatus } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UseFormReturn } from 'react-hook-form';

interface DebtSummaryTabProps {
  form: UseFormReturn<any>;
  debt?: DebtDTO | null;
  accounts: { id: string; name: string }[];
  categories?: { id: string; name: string; color: string }[];
  suppliers?: { id: string; name: string }[];
  paymentMethods?: { id: string; name: string }[];
}

const statusBadgeMap: Record<TransactionStatus, { label: string; className: string }> = {
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

export function DebtSummaryTab({
  form,
  debt,
  accounts,
  categories = [],
  suppliers = [],
  paymentMethods = [],
}: DebtSummaryTabProps) {
  const name = form.watch('name') || '';
  const description = form.watch('description') || '';
  const initialValue = form.watch('initialValue');
  const installments = form.watch('installments');
  const calculationType = form.watch('calculationType');
  const installmentValue = form.watch('installmentValue');
  const firstInstallmentDate = form.watch('firstInstallmentDate');
  const firstInstallmentMonth = form.watch('firstInstallmentMonth');
  const periodicity = form.watch('periodicity') || Periodicity.MONTHLY;
  const dueDay = form.watch('dueDay');
  const accountId = form.watch('accountId');
  const supplierId = form.watch('supplierId');
  const categoryId = form.watch('categoryId');
  const paymentMethodId = form.watch('paymentMethodId');

  const initialValueNumber =
    typeof initialValue === 'string' ? parseFloat(initialValue) || 0 : Number(initialValue) || 0;
  const installmentsNumber =
    typeof installments === 'string' ? parseInt(installments, 10) || 0 : Number(installments) || 0;
  const installmentValueNumber =
    typeof installmentValue === 'string'
      ? parseFloat(installmentValue) || null
      : Number(installmentValue) || null;

  const preview = calculateInstallmentPreview({
    initialValue: initialValueNumber,
    installments: installmentsNumber,
    calculationType,
    installmentValue: installmentValueNumber,
    firstInstallmentDate,
    firstInstallmentMonth,
    dueDay: dueDay ? Number(dueDay) : null,
    periodicity,
  });

  const accountName = accounts.find((a) => a.id === accountId)?.name || '-';
  const supplierName = suppliers.find((s) => s.id === supplierId)?.name || '-';
  const categoryName = categories.find((c) => c.id === categoryId)?.name || '-';
  const categoryColor = categories.find((c) => c.id === categoryId)?.color || '#94a3b8';
  const paymentMethodName = paymentMethods.find((p) => p.id === paymentMethodId)?.name || '-';

  const debtPaid = debt ? debt.initialValue - debt.currentValue : 0;
  const debtPercentage = debt && debt.initialValue > 0 ? (debtPaid / debt.initialValue) * 100 : 0;
  const paidInstallments =
    debt && debt.installments
      ? debt.installments - (debt.remainingInstallments ?? debt.installments)
      : 0;

  const periodicityLabel =
    PERIODICITY_LABELS[periodicity as Periodicity] || PERIODICITY_LABELS[Periodicity.MONTHLY];

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-muted-foreground text-sm font-semibold uppercase">Resumo da dívida</h3>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Nome</span>
          <span className="font-medium">{name || '-'}</span>
        </div>
        {description && (
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm">Descrição</span>
            <span className="text-muted-foreground max-w-[60%] text-right text-sm">
              {description}
            </span>
          </div>
        )}
        {!debt && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Fornecedor</span>
              <span className="font-medium">{supplierName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Categoria</span>
              <span className="flex items-center gap-2 font-medium">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor }} />
                {categoryName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Conta para pagamento</span>
              <span className="font-medium">{accountName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Meio de pagamento</span>
              <span className="font-medium">{paymentMethodName}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-sm">Valor total</span>
          <span className="text-lg font-bold">{formatCurrency(initialValueNumber)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Parcelamento</span>
          <span className="font-medium">
            {installmentsNumber} {installmentsNumber === 1 ? 'parcela' : 'parcelas'} ·{' '}
            {periodicityLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground block text-xs">Primeiro vencimento</span>
            <span className="text-sm font-medium">
              {preview.firstDueDate
                ? format(preview.firstDueDate, 'dd/MM/yyyy', { locale: ptBR })
                : '-'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Último vencimento</span>
            <span className="text-sm font-medium">
              {preview.lastDueDate
                ? format(preview.lastDueDate, 'dd/MM/yyyy', { locale: ptBR })
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {debt && (
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase">Progresso</h3>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Valor pago</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatCurrency(debtPaid)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Valor restante</span>
            <span className="font-medium text-red-500">
              {formatCurrency(debt ? debt.currentValue : initialValueNumber)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Parcelas pagas</span>
            <span className="font-medium">
              {paidInstallments} de {debt.installments ?? installmentsNumber}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Conclusão</span>
            <span className="font-medium">{debtPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={debtPercentage} />
        </div>
      )}

      <div className="space-y-2 rounded-lg border p-4">
        <h3 className="text-muted-foreground text-sm font-semibold uppercase">Parcelas</h3>
        {preview.items.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Preencha o valor total e a quantidade de parcelas para visualizar a prévia.
          </p>
        ) : (
          <div className="divide-y">
            {preview.items.map((item) => (
              <div
                key={item.installmentNumber}
                className="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <span className="text-muted-foreground w-12">
                  {String(item.installmentNumber).padStart(2, '0')}/
                  {String(item.totalInstallments).padStart(2, '0')}
                </span>
                <span className="flex-1">
                  {format(item.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <span className="w-24 text-right font-medium">{formatCurrency(item.amount)}</span>
                <Badge variant="secondary" className={statusBadgeMap[item.status].className}>
                  {statusBadgeMap[item.status].label}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {preview.items.length > 0 && (
          <div className="text-muted-foreground flex justify-between border-t pt-2 text-xs">
            <span>Total das parcelas</span>
            <span className={preview.sum === preview.total ? '' : 'text-amber-600'}>
              {formatCurrency(preview.sum)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
