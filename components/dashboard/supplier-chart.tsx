'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartAltRenderer } from './chart-alt-renderer';
import { ChartTypeSwitcher, type ChartVisualType } from './chart-type-switcher';

interface SupplierChartProps {
  data: { name: string; value: number }[];
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function SupplierChart({ data }: SupplierChartProps) {
  const [chartType, setChartType] = useState<ChartVisualType>('default');

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
          {chartType === 'default' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value: any) => currencyFormatter(Number(value))}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartAltRenderer
              type={chartType}
              data={data}
              series={[{ dataKey: 'value', name: 'Fornecedor', color: '#6366f1' }]}
              tooltipFormatter={currencyFormatter}
              axisFormatter={(v) => `R$${v}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
