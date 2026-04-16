"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewChartProps {
  data: {
    name: string;
    receitas: number;
    despesas: number;
  }[];
  isFullYear?: boolean;
}

export function OverviewChart({ data, isFullYear }: OverviewChartProps) {
  return (
    <Card className="col-span-1 border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Receitas vs Despesas ({isFullYear ? "Ano Completo" : "Últimos 6 Meses"})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
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
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: "#f8fafc" }}
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
        </div>
      </CardContent>
    </Card>
  );
}
