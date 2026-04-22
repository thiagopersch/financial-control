'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInsights } from '@/lib/queries/insights';

interface Insight {
  type: 'increase' | 'decrease' | 'warning' | 'info';
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  severity?: 'info' | 'warning' | 'alert';
  createdAt?: string;
}

interface CategoryComparison {
  category: string;
  currentMonth: number;
  previousMonth: number;
  change: number;
  color: string;
}

interface SpendingHighlight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { insights, isLoading } = useInsights();

  const [comparisons, setComparisons] = useState<CategoryComparison[]>([]);
  const [highlights, setHighlights] = useState<SpendingHighlight[]>([]);
  const [summary, setSummary] = useState<{
    totalIncome: number;
    totalExpense: number;
    netResult: number;
    previousIncome: number;
    previousExpense: number;
    previousNetResult: number;
  } | null>(null);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadge = (type: string) => {
    switch (type) {
      case 'increase':
        return <Badge className="bg-green-500">Aumento</Badge>;
      case 'decrease':
        return <Badge className="bg-red-500">Redução</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Atenção</Badge>;
      default:
        return <Badge>Info</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights Financeiros</h1>
        <p className="text-muted-foreground">Análise inteligente dos seus dados financeiros</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="bg-muted h-20 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
                <DollarSign className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalIncome || 0)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {summary && summary.previousIncome > 0
                    ? `${(((summary.totalIncome - summary.previousIncome) / summary.previousIncome) * 100).toFixed(1)}% vs mês anterior`
                    : 'Dados não disponíveis'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
                <TrendingDown className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalExpense || 0)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {summary && summary.previousExpense > 0
                    ? `${(((summary.totalExpense - summary.previousExpense) / summary.previousExpense) * 100).toFixed(1)}% vs mês anterior`
                    : 'Dados não disponíveis'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
                {summary?.netResult && summary.netResult >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${summary?.netResult && summary.netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {formatCurrency(summary?.netResult || 0)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {summary?.previousNetResult
                    ? `${(((summary.netResult - summary.previousNetResult) / Math.abs(summary.previousNetResult)) * 100).toFixed(1)}% vs mês anterior`
                    : 'Dados não disponíveis'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Mês</CardTitle>
                  <CardDescription>Comparação entre receitas e despesas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Receitas', value: summary?.totalIncome || 0 },
                          { name: 'Despesas', value: summary?.totalExpense || 0 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Destaques de Gastos</CardTitle>
                    <CardDescription>Categorias com maior participação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {highlights.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{formatCurrency(item.amount)}</span>
                            <span className="text-muted-foreground ml-2 text-sm">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Mensal</CardTitle>
                  <CardDescription>Evolução por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisons}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="currentMonth" fill="#0ea5e9" name="Mês Atual" />
                        <Bar dataKey="previousMonth" fill="#94a3b8" name="Mês Anterior" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {insights.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="text-lg font-semibold">Nenhum alerta</h3>
                    <p className="text-muted-foreground mt-2 text-center">
                      Seus insights estarão disponíveis em breve
                    </p>
                  </CardContent>
                </Card>
              ) : (
                insights.map((insight, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <CardDescription>{insight.description}</CardDescription>
                      </div>
                      {getInsightBadge(insight.type)}
                    </CardHeader>
                    {insight.value !== undefined && (
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(insight.value)}
                          {insight.percentage !== undefined && (
                            <span className="text-muted-foreground ml-2 text-sm font-normal">
                              ({insight.percentage > 0 ? '+' : ''}
                              {insight.percentage.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
