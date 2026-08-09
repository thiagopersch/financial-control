'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BudgetProgressChartProps {
  budgets: { id: string; amount: number; spent: number; percent: number; category: { name: string } }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function BudgetProgressChart({ budgets }: BudgetProgressChartProps) {
  if (budgets.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Progresso de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center">
          Nenhum orçamento configurado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Progresso de Orçamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {budgets.map((budget) => {
          const percentage = Math.min(budget.percent, 100);
          const isOver = budget.percent >= 100;
          const isWarning = budget.percent >= 80 && budget.percent < 100;
          return (
            <div key={budget.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{budget.category.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              <Progress
                value={percentage}
                className={cn(
                  'h-2',
                  isOver
                    ? '[&>div]:bg-rose-500'
                    : isWarning
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-emerald-500',
                )}
              />
              <p className="text-muted-foreground text-right text-xs">
                {budget.percent.toFixed(0)}% utilizado
              </p>
            </div>
          );
        })}
        <Link
          href="/budgets"
          className="text-primary block text-center text-sm font-medium hover:underline"
        >
          Ver todos os orçamentos
        </Link>
      </CardContent>
    </Card>
  );
}
