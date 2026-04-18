'use client';

import { BudgetDialog } from '@/components/budgets/budget-dialog';
import { BudgetWidget } from '@/components/dashboard/budget-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Plus } from 'lucide-react';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
}

interface BudgetsPageClientProps {
  initialBudgets: any[];
  categories: Category[];
}

export function BudgetsPageClient({ initialBudgets, categories }: BudgetsPageClientProps) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleEdit = (budget: any) => {
    setEditingBudget({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      alertAt80: budget.alertAt80,
      alertAt100: budget.alertAt100,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          className="gap-2"
          onClick={() => {
            setEditingBudget(null);
            setIsDialogOpen(true);
          }}
        >
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
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setEditingBudget(null);
                  setIsDialogOpen(true);
                }}
              >
                Começar agora
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categories={categories}
        editingBudget={editingBudget}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
