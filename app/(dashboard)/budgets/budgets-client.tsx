"use client";

import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, PieChart, Plus } from "lucide-react";
import { useState } from "react";

interface BudgetsPageClientProps {
  initialBudgets: any[];
  categories: any[];
}

export function BudgetsPageClient({ initialBudgets, categories }: BudgetsPageClientProps) {
  const [budgets, setBudgets] = useState(initialBudgets);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Configurar Orçamento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map((budget) => (
            <div key={budget.id} className="lg:col-span-1">
              <BudgetWidget budgets={[budget]} />
            </div>
          ))
        ) : (
          <Card className="col-span-full py-20">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-muted rounded-full p-4">
                <PieChart className="text-muted-foreground h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Nenhum orçamento configurado</h3>
                <p className="text-muted-foreground mx-auto max-w-xs">
                  Defina limites para suas categorias e receba alertas quando estiver próximo de
                  atingi-los.
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Começar agora
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-start gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
        <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-bold">Dica Financeira</p>
          <p>
            Orçamentos ajudam você a manter o controle sobre gastos variáveis. Tente não comprometer
            mais de 50% da sua receita com gastos essenciais.
          </p>
        </div>
      </div>
    </div>
  );
}
