'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface DebtProgressChartProps {
  debts: { id: string; name: string; currentValue: number; initialValue: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DebtProgressChart({ debts }: DebtProgressChartProps) {
  if (debts.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Progresso das Dívidas</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center">
          Nenhuma dívida ativa. 🎉
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Progresso das Dívidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {debts.map((debt) => {
          const paid = debt.initialValue - debt.currentValue;
          const percentage = debt.initialValue > 0 ? (paid / debt.initialValue) * 100 : 0;
          return (
            <div key={debt.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{debt.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {formatCurrency(debt.currentValue)}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <p className="text-muted-foreground text-right text-xs">
                {percentage.toFixed(0)}% pago
              </p>
            </div>
          );
        })}
        <Link
          href="/debts"
          className="text-primary block text-center text-sm font-medium hover:underline"
        >
          Ver todas as dívidas
        </Link>
      </CardContent>
    </Card>
  );
}
