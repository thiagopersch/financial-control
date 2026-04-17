"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Insight {
  type: "increase" | "decrease" | "warning" | "info";
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  icon?: "up" | "down" | "warning";
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
  trend: "up" | "down" | "stable";
  color: string;
}

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
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

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/insights");
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
        setComparisons(data.comparisons || []);
        setHighlights(data.highlights || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights Financeiros</h1>
        <p className="text-muted-foreground">
          Análises e comparações automáticas do seu desempenho financeiro
        </p>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas (Mês Atual)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-muted-foreground text-xs">
                vs {formatCurrency(summary.previousIncome)} no mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas (Mês Atual)</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpense)}
              </div>
              <p className="text-muted-foreground text-xs">
                vs {formatCurrency(summary.previousExpense)} no mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.netResult >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(summary.netResult)}
              </div>
              <p
                className={`text-xs ${summary.netResult >= summary.previousNetResult ? "text-green-600" : "text-red-600"}`}
              >
                vs {formatCurrency(summary.previousNetResult)} no mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evolução</CardTitle>
              {summary.netResult >= summary.previousNetResult ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.netResult >= summary.previousNetResult ? "text-green-600" : "text-red-600"}`}
              >
                {formatPercentage(
                  ((summary.netResult - summary.previousNetResult) /
                    Math.abs(summary.previousNetResult || 1)) *
                    100,
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {summary.netResult >= summary.previousNetResult ? "Melhor que" : "Pior que"} mês
                anterior
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {insights.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <CardTitle>Destaques</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    insight.type === "warning"
                      ? "border-yellow-300 bg-yellow-100/50 dark:bg-yellow-900/30"
                      : insight.type === "increase"
                        ? "border-green-300 bg-green-100/50 dark:bg-green-900/30"
                        : insight.type === "decrease"
                          ? "border-red-300 bg-red-100/50 dark:bg-red-900/30"
                          : "border-blue-300 bg-blue-100/50 dark:bg-blue-900/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === "warning" && (
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                    )}
                    {insight.type === "increase" && (
                      <TrendingUp className="mt-0.5 h-5 w-5 text-green-600" />
                    )}
                    {insight.type === "decrease" && (
                      <TrendingDown className="mt-0.5 h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{insight.title}</p>
                      <p className="text-muted-foreground text-sm">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="comparisons">
        <TabsList>
          <TabsTrigger value="comparisons">Comparativo</TabsTrigger>
          <TabsTrigger value="highlights">Maiores Gastos</TabsTrigger>
        </TabsList>

        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo por Categoria</CardTitle>
              <CardDescription>Mês atual vs mês anterior</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
              ) : comparisons.length === 0 ? (
                <div className="text-muted-foreground flex h-[400px] items-center justify-center">
                  Dados insuficientes para comparação
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisons} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis dataKey="category" type="category" width={100} />
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(Number(value)),
                          name === "currentMonth" ? "Mês Atual" : "Mês Anterior",
                        ]}
                      />
                      <Bar dataKey="currentMonth" fill="#6366f1" name="Mês Atual" />
                      <Bar dataKey="previousMonth" fill="#94a3b8" name="Mês Anterior" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maiores Gastos do Mês</CardTitle>
              <CardDescription>Categorias com maior impacto no seu orçamento</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-muted h-16 animate-pulse rounded" />
                  ))}
                </div>
              ) : highlights.length === 0 ? (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                  Nenhum gasto registrado
                </div>
              ) : (
                <div className="space-y-4">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: highlight.color }}
                          />
                          <span className="font-medium">{highlight.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(highlight.amount)}</span>
                          <Badge variant="outline">
                            {highlight.percentage.toFixed(1)}%{highlight.trend === "up" && " ↑"}
                            {highlight.trend === "down" && " ↓"}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={highlight.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
