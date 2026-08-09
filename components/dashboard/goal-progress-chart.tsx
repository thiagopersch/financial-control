'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface GoalProgressChartProps {
  goals: { id: string; name: string; targetAmount: number; currentAmount: number; percent: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function GoalProgressChart({ goals }: GoalProgressChartProps) {
  if (goals.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Progresso de Metas</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center">
          Nenhuma meta cadastrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Progresso de Metas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {goals.map((goal) => {
          const percentage = Math.min(goal.percent, 100);
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{goal.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </span>
              </div>
              <Progress value={percentage} className="h-2 [&>div]:bg-emerald-500" />
              <p className="text-muted-foreground text-right text-xs">
                {percentage.toFixed(0)}% concluído
              </p>
            </div>
          );
        })}
        <Link
          href="/goals"
          className="text-primary block text-center text-sm font-medium hover:underline"
        >
          Ver todas as metas
        </Link>
      </CardContent>
    </Card>
  );
}
