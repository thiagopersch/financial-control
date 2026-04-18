"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ForecastData {
  month: string;
  actual: number;
  forecast: number;
}

interface CategoryForecast {
  category: string;
  average: number;
  forecast: number;
  trend: "up" | "down" | "stable";
}

export default function ForecastPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ForecastData[]>([]);
  const [categoryForecast, setCategoryForecast] = useState<CategoryForecast[]>([]);
  const [period, setPeriod] = useState<"3" | "6">("3");

  useEffect(() => {
    fetchForecast();
  }, [period]);

  const fetchForecast = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forecast?months=${period}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data.chartData || []);
        setCategoryForecast(data.categoryForecast || []);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
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

  const averageExpense =
    chartData.length > 0
      ? chartData.reduce((sum, d) => sum + (d.actual || 0), 0) /
        chartData.filter((d) => d.actual).length
      : 0;

  const forecastTotal = chartData.reduce((sum, d) => sum + d.forecast, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Previsão de Gastos</h1>
        <p className="text-muted-foreground">Projeção de gastos baseada no histórico</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Gastos</CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageExpense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projeção Total</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(forecastTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.length >= 2
                ? chartData[chartData.length - 1].forecast >
                  chartData[chartData.length - 2].forecast
                  ? "↑ Alta"
                  : chartData[chartData.length - 1].forecast <
                      chartData[chartData.length - 2].forecast
                    ? "↓ Queda"
                    : "→ Estável"
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as "3" | "6")}>
        <TabsList>
          <TabsTrigger value="3">3 meses</TabsTrigger>
          <TabsTrigger value="6">6 meses</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Gastos</CardTitle>
              <CardDescription>Histórico e previsão para os próximos meses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-muted-foreground flex h-[400px] items-center justify-center">
                  Dados insuficientes para previsão
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#6366f1"
                        strokeWidth={2}
                        name="Real"
                        dot={{ fill: "#6366f1" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#22c55e"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Projeção"
                        dot={{ fill: "#22c55e" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {categoryForecast.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previsão por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryForecast.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{cat.category}</span>
                        <Badge variant="outline">
                          {cat.trend === "up" ? "↑" : cat.trend === "down" ? "↓" : "→"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(cat.forecast)}</span>
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
