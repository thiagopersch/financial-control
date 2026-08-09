'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartAltRenderer } from './chart-alt-renderer';
import { ChartTypeSwitcher, type ChartVisualType } from './chart-type-switcher';

interface OverviewChartProps {
  data: {
    name: string;
    receitas: number;
    despesas: number;
  }[];
  isFullYear?: boolean;
  isAllPeriod?: boolean;
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function OverviewChart({ data, isFullYear, isAllPeriod }: OverviewChartProps) {
  const [chartType, setChartType] = useState<ChartVisualType>('default');

  const getTitle = () => {
    if (isAllPeriod) return 'Receitas vs Despesas (Todos os Períodos)';
    if (isFullYear) return 'Receitas vs Despesas (Ano Completo)';
    return 'Receitas vs Despesas (Últimos 6 Meses)';
  };

  return (
    <Card className="col-span-1 border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">{getTitle()}</CardTitle>
        <ChartTypeSwitcher value={chartType} onChange={setChartType} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartType === 'default' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
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
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar
                  dataKey="receitas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  name="Receitas"
                />
                <Bar
                  dataKey="despesas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  name="Despesas"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartAltRenderer
              type={chartType}
              data={data}
              series={[
                { dataKey: 'receitas', name: 'Receitas', color: '#10b981' },
                { dataKey: 'despesas', name: 'Despesas', color: '#ef4444' },
              ]}
              tooltipFormatter={currencyFormatter}
              axisFormatter={(v) => `R$${v}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
