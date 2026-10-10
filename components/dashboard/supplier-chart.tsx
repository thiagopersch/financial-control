'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { ChartAltRenderer } from './chart-alt-renderer';
import { ChartTypeSwitcher, type ChartAltType } from './chart-type-switcher';

interface SupplierChartProps {
  data: { name: string; value: number; color?: string }[];
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function SupplierChart({ data }: SupplierChartProps) {
  const [chartType, setChartType] = useState<ChartAltType>('pie');

  if (data.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Despesas por Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center">
          Nenhuma despesa com fornecedor neste período.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Despesas por Fornecedor</CardTitle>
        <ChartTypeSwitcher value={chartType} onChange={setChartType} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartAltRenderer
            type={chartType}
            data={data}
            series={[{ dataKey: 'value', name: 'Fornecedor', color: '#6366f1' }]}
            tooltipFormatter={currencyFormatter}
            axisFormatter={(v) => `R$${v}`}
            pieColorKey="color"
          />
        </div>
      </CardContent>
    </Card>
  );
}
