import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency } from '@/lib/utils';
import type { AmountCount, TransactionTotals } from '@/lib/utils/transaction-totals';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

interface TransactionsTotalsProps {
  totals: TransactionTotals;
  totalCount: number;
}

function TotalsBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-background/60 flex min-w-0 flex-col gap-1.5 rounded-lg border p-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

function BlockHeader({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className={cn('text-base font-bold whitespace-nowrap tabular-nums', className)}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function BreakdownLine({
  icon,
  label,
  data,
  className,
  nested,
}: {
  icon: ReactNode;
  label: string;
  data: AmountCount;
  className?: string;
  nested?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 text-sm',
        nested && 'pl-5 text-xs',
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {label} ({data.count})
      </span>
      <span className="font-medium whitespace-nowrap tabular-nums">
        {formatCurrency(data.amount)}
      </span>
    </div>
  );
}

/** Resumo do rodapé da lista: despesas (pagas/a pagar/atrasadas), receitas e saldo previsto. */
export function TransactionsTotals({ totals, totalCount }: TransactionsTotalsProps) {
  const { expense, income } = totals;

  return (
    <div className="@container flex flex-col gap-3">
      <span className="text-sm font-semibold">
        Total: {totalCount} transaç{totalCount === 1 ? 'ão' : 'ões'}
      </span>

      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-3">
        <TotalsBlock>
          <BlockHeader
            label={`Despesas (${expense.count})`}
            value={expense.amount}
            className="text-rose-600 dark:text-rose-400"
          />
          <BreakdownLine
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Pagas"
            data={expense.paid}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <BreakdownLine
            icon={<Clock className="h-3.5 w-3.5" />}
            label="A pagar"
            data={expense.pending}
            className="text-amber-600 dark:text-amber-400"
          />
          {expense.overdue.count > 0 && (
            <BreakdownLine
              nested
              icon={<AlertTriangle className="h-3 w-3" />}
              label="Atrasadas"
              data={expense.overdue}
              className="text-red-600 dark:text-red-400"
            />
          )}
          {expense.count > 0 && (
            <div className="mt-auto flex items-center gap-2 pt-1">
              <Progress
                value={expense.paidPercent}
                aria-label="Percentual das despesas pago"
                className="h-1.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
              />
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {expense.paidPercent}% pago
              </span>
            </div>
          )}
        </TotalsBlock>

        <TotalsBlock>
          <BlockHeader
            label={`Receitas (${income.count})`}
            value={income.amount}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <BreakdownLine
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Recebidas"
            data={income.received}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <BreakdownLine
            icon={<Clock className="h-3.5 w-3.5" />}
            label="A receber"
            data={income.pending}
            className="text-amber-600 dark:text-amber-400"
          />
        </TotalsBlock>

        <TotalsBlock>
          <BlockHeader
            label="Saldo previsto"
            value={totals.balance}
            className={
              totals.balance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }
          />
          <p className="text-muted-foreground text-xs">Receitas − despesas do período filtrado.</p>
          <div className="mt-auto flex items-center justify-between gap-3 border-t pt-1.5 text-sm">
            <span className="text-muted-foreground">Recebido − pago</span>
            <span
              className={cn(
                'font-medium tabular-nums',
                totals.realizedBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {formatCurrency(totals.realizedBalance)}
            </span>
          </div>
        </TotalsBlock>
      </div>
    </div>
  );
}
