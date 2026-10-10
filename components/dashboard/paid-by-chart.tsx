'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { ChartAltRenderer } from './chart-alt-renderer';
import { ChartTypeSwitcher, type ChartAltType } from './chart-type-switcher';

interface PaidByChartProps {
  data: { name: string; value: number; count: number; color: string }[];
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PaidByChart({ data }: PaidByChartProps) {
  const [chartType, setChartType] = useState<ChartAltType>('bar-horizontal');
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  if (data.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Despesas pagas por usuário</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center text-center">
          Nenhuma despesa paga neste período.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Despesas pagas por usuário</CardTitle>
          <p className="text-muted-foreground mt-1 text-xs">
            Total pago:{' '}
            <span className="text-foreground font-medium tabular-nums">
              {currencyFormatter(total)}
            </span>
          </p>
        </div>
        <ChartTypeSwitcher value={chartType} onChange={setChartType} />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ChartAltRenderer
            type={chartType}
            data={data}
            series={[{ dataKey: 'value', name: 'Pago por', color: '#6366f1' }]}
            tooltipFormatter={currencyFormatter}
            axisFormatter={(v) => `R$${v}`}
            pieColorKey="color"
          />
        </div>
      </CardContent>
    </Card>
  );
}
