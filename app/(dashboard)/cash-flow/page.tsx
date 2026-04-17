"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, addDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectedTransaction {
  date: string;
  balance: number;
  income: number;
  expense: number;
  label?: string;
}

interface CashFlowSummary {
  currentBalance: number;
  projectedEndBalance: number;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  lowestBalance: { date: string; amount: number };
  highestBalance: { date: string; amount: number };
  deficitDays: { date: string; amount: number }[];
}

export default function CashFlowPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ProjectedTransaction[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [period, setPeriod] = useState<"30" | "60" | "90">("30");

  useEffect(() => {
    fetchCashFlow();
  }, [period]);

  const fetchCashFlow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cash-flow?days=${period}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data.chartData || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error("Error fetching cash flow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM", { locale: ptBR });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground">
          Projeção do seu saldo futuro com base em transações recorrentes e agendadas
        </p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as "30" | "60" | "90")}>
        <TabsList>
          <TabsTrigger value="30">30 dias</TabsTrigger>
          <TabsTrigger value="60">60 dias</TabsTrigger>
          <TabsTrigger value="90">90 dias</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6">
          {summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(summary.currentBalance)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
                  {summary.projectedEndBalance >= summary.currentBalance ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${summary.projectedEndBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(summary.projectedEndBalance)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalIncome)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpense)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {summary?.deficitDays && summary.deficitDays.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-600">Atenção: Déficit Identificado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Foram identificados {summary.deficitDays.length} dias com saldo negativo no
                  período projetado:
                </p>
                <div className="flex flex-wrap gap-2">
                  {summary.deficitDays.slice(0, 5).map((day) => (
                    <Badge key={day.date} variant="outline" className="border-red-300 text-red-700">
                      {formatDate(day.date)}: {formatCurrency(day.amount)}
                    </Badge>
                  ))}
                  {summary.deficitDays.length > 5 && (
                    <Badge variant="outline">+{summary.deficitDays.length - 5} dias</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Projeção de Saldo</CardTitle>
              <CardDescription>Evolução do saldo ao longo do período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-muted-foreground flex h-[400px] flex-col items-center justify-center">
                  <Calendar className="mb-4 h-12 w-12" />
                  <p>Dados insuficientes para projeção</p>
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => formatDate(value)}
                        className="text-xs"
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                      <Tooltip
                        formatter={(value) => [formatCurrency(Number(value)), "Saldo"]}
                        labelFormatter={(value) =>
                          format(new Date(String(value)), "dd MMM yyyy", { locale: ptBR })
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {chartData.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Entradas e Saídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => formatDate(value)}
                          className="text-xs"
                        />
                        <YAxis
                          tickFormatter={(value) => formatCurrency(value)}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name === "income" ? "Entradas" : "Saídas",
                          ]}
                          labelFormatter={(value) =>
                            format(new Date(String(value)), "dd MMM yyyy", { locale: ptBR })
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="income"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="expense"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Período</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo Inicial</span>
                      <span className="font-medium">
                        {formatCurrency(summary?.currentBalance || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total de Entradas</span>
                      <span className="font-medium text-green-600">
                        + {formatCurrency(summary?.totalIncome || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total de Saídas</span>
                      <span className="font-medium text-red-600">
                        - {formatCurrency(summary?.totalExpense || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-sm font-medium">
                      <span>Saldo Final Projetado</span>
                      <span
                        className={
                          summary && summary.projectedEndBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(summary?.projectedEndBalance || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
