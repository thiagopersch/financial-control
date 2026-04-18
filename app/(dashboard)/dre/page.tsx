"use client";

import { useState, useEffect } from "react";
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DREData {
  period: string;
  revenue: number;
  expense: number;
  result: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

export default function DREPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"3" | "6" | "12">("6");
  const [summary, setSummary] = useState<{
    totalRevenue: number;
    totalExpense: number;
    netResult: number;
  } | null>(null);
  const [chartData, setChartData] = useState<DREData[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([]);

  useEffect(() => {
    fetchDRE();
  }, [period]);

  const fetchDRE = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dre?months=${period}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setChartData(data.chartData || []);
        setExpensesByCategory(data.expensesByCategory || []);
      }
    } catch (error) {
      console.error("Error fetching DRE:", error);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DRE</h1>
        <p className="text-muted-foreground">Demonstrativo de Resultado do Exercício</p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as "3" | "6" | "12")}>
        <TabsList>
          <TabsTrigger value="3">3 meses</TabsTrigger>
          <TabsTrigger value="6">6 meses</TabsTrigger>
          <TabsTrigger value="12">12 meses</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6">
          {summary && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpense)}
                  </div>
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
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>Receita, despesa e resultado por período</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-muted-foreground flex h-[400px] items-center justify-center">
                  Dados insuficientes
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" tickFormatter={(value) => value} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(Number(value)),
                          name === "revenue"
                            ? "Receita"
                            : name === "expense"
                              ? "Despesa"
                              : "Resultado",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#22c55e" name="Receita" />
                      <Bar dataKey="expense" fill="#ef4444" name="Despesa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {expensesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expensesByCategory.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span>{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(cat.amount)}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
