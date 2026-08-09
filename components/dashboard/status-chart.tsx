'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartAltRenderer } from './chart-alt-renderer';
import { ChartTypeSwitcher, type ChartVisualType } from './chart-type-switcher';

interface StatusChartProps {
  data: { name: string; value: number; count: number; color: string }[];
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function StatusChart({ data }: StatusChartProps) {
  const [chartType, setChartType] = useState<ChartVisualType>('default');

  if (data.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Status das Despesas</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center">
          Nenhuma transação neste período.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Status das Despesas</CardTitle>
        <ChartTypeSwitcher value={chartType} onChange={setChartType} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartType === 'default' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, _name: any, item: any) => [
                    currencyFormatter(Number(value)),
                    `${item?.payload?.name} (${item?.payload?.count})`,
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartAltRenderer
              type={chartType}
              data={data}
              series={[{ dataKey: 'value', name: 'Status', color: '#6366f1' }]}
              tooltipFormatter={currencyFormatter}
              axisFormatter={(v) => `R$${v}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
