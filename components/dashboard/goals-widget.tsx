"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Target, TrendingUp } from "lucide-react";

export function GoalsWidget({ goals }: { goals: any[] }) {
  if (goals.length === 0)
    return (
      <Card className="col-span-full xl:col-span-1">
        <CardHeader>
          <CardTitle>Metas Financeiras</CardTitle>
          <CardDescription>Planeje seus sonhos e objetivos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-muted mb-3 rounded-full p-3">
            <Target className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">Você ainda não definiu nenhuma meta.</p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="border-primary/20 col-span-full overflow-hidden shadow-sm xl:col-span-1">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Target size={120} />
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-primary h-5 w-5" />
          Metas Financeiras
        </CardTitle>
        <CardDescription>Progresso em direção aos seus objetivos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{goal.name}</h4>
                {goal.deadline && (
                  <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium uppercase">
                    <Calendar size={10} />
                    Prazo: {format(new Date(goal.deadline), "MMMM 'y'", { locale: ptBR })}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-primary text-sm font-bold">{goal.percent.toFixed(0)}%</span>
              </div>
            </div>

            <Progress value={goal.percent} className="bg-primary/10 [&>div]:bg-primary h-3" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Atingido:{" "}
                <span className="text-foreground font-semibold">
                  {formatCurrency(goal.currentAmount)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Alvo:{" "}
                <span className="text-foreground font-semibold">
                  {formatCurrency(goal.targetAmount)}
                </span>
              </span>
            </div>

            {goal.targetAmount > goal.currentAmount && (
              <div className="bg-primary/5 border-primary/10 flex items-center gap-2 rounded-md border p-2">
                <TrendingUp size={12} className="text-primary" />
                <span className="text-primary-foreground/80 text-[10px] font-medium">
                  Faltam {formatCurrency(goal.targetAmount - goal.currentAmount)} para o objetivo.
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
