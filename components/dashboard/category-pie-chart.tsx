'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartAltRenderer } from './chart-alt-renderer';
import { ChartTypeSwitcher, type ChartAltType } from './chart-type-switcher';

interface CategoryPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  isFullYear?: boolean;
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CategoryPieChart({ data, isFullYear }: CategoryPieChartProps) {
  const [chartType, setChartType] = useState<ChartAltType>('pie');

  if (data.length === 0) {
    return (
      <Card className="col-span-1 border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center">
          Nenhuma transação {isFullYear ? 'este ano' : 'este mês'}.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
        <ChartTypeSwitcher value={chartType} onChange={setChartType} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartAltRenderer
            type={chartType}
            data={data}
            series={[{ dataKey: 'value', name: 'Categoria', color: '#6366f1' }]}
            tooltipFormatter={currencyFormatter}
            axisFormatter={(v) => `R$${v}`}
            pieColorKey="color"
          />
        </div>
      </CardContent>
    </Card>
  );
}
