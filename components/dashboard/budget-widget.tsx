"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function BudgetWidget({ budgets }: { budgets: any[] }) {
  if (budgets.length === 0)
    return (
      <Card className="col-span-full xl:col-span-1">
        <CardHeader>
          <CardTitle>Orçamentos</CardTitle>
          <CardDescription>Acompanhe seus limites por categoria.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-muted mb-3 rounded-full p-3">
            <AlertCircle className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhum orçamento definido para este mês.</p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="from-background to-muted/20 col-span-full bg-linear-to-br xl:col-span-1">
      <CardHeader>
        <CardTitle>Orçamentos do Mês</CardTitle>
        <CardDescription>Monitoramento em tempo real dos seus gastos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {budgets.map((budget) => {
          const isOver = budget.percent >= 100;
          const isWarning = budget.percent >= 80 && budget.percent < 100;

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: budget.category.color }}
                  />
                  <span className="font-semibold">{budget.category.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{formatCurrency(budget.spent)}</span>
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    / {formatCurrency(budget.amount)}
                  </span>
                </div>
              </div>
              <div className="relative pt-1">
                <Progress
                  value={Math.min(budget.percent, 100)}
                  className={cn(
                    "h-2",
                    isOver
                      ? "[&>div]:bg-rose-500"
                      : isWarning
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-emerald-500",
                  )}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold tracking-tight uppercase">
                <span
                  className={cn(
                    isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-emerald-600",
                  )}
                >
                  {budget.percent.toFixed(0)}% Utilizado
                </span>
                {isOver ? (
                  <span className="flex items-center gap-1 text-rose-600">
                    <AlertCircle size={10} /> Estourado
                  </span>
                ) : isWarning ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle size={10} /> Alerta (80%+)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={10} /> Seguro
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
