'use client';

import { useComparisons } from '@/lib/queries/comparisons-client';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useState } from 'react';

export default function ComparisonsPage() {
  const [comparisonType, setComparisonType] = useState('month');
  const { chartData, summary, isLoading } = useComparisons(comparisonType);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comparativos</h1>
          <p className="text-muted-foreground">Compare períodos, categorias e muito mais</p>
        </div>
        <Select value={comparisonType} onValueChange={setComparisonType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mês vs Mês</SelectItem>
            <SelectItem value="year">Ano vs Ano</SelectItem>
            <SelectItem value="category">Por Categoria</SelectItem>
            <SelectItem value="account">Por Conta</SelectItem>
            <SelectItem value="cost_center">Por Centro de Custo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variação Receitas</CardTitle>
              {summary.incomeChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatPercentage(summary.incomeChange)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variação Despesas</CardTitle>
              {summary.expenseChange <= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatPercentage(summary.expenseChange)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variação Resultado</CardTitle>
              {summary.netChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatPercentage(summary.netChange)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Valores</CardTitle>
          <CardDescription>Período atual vs período anterior</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-muted-foreground flex h-[400px] items-center justify-center">
              Dados insuficientes para comparação
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="current" fill="var(--color-primary, #10B981)" name="Atual" />
                  <Bar
                    dataKey="previous"
                    fill="var(--color-muted-foreground, #94a3b8)"
                    name="Anterior"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
