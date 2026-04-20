'use client';

import { BudgetDialog } from '@/components/budgets/budget-dialog';
import { BudgetWidget } from '@/components/dashboard/budget-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MonthSelector } from '@/components/month-selector';
import { PieChart, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetData {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertAt80: boolean;
  alertAt100: boolean;
  category: Category;
}

interface BudgetsPageClientProps {
  categories: Category[];
}

function parseMonthParams(yearStr: string | null, monthStr: string | null): { month: number; year: number; isAllPeriod: boolean; isYear: boolean } {
  const now = new Date();
  
  // Novos parâmetros: year e month
  if (!yearStr) {
    // Sem parâmetros - usa mês atual
    return { month: now.getMonth() + 1, year: now.getFullYear(), isAllPeriod: false, isYear: false };
  }
  
  if (yearStr === 'all') {
    return { month: 0, year: 0, isAllPeriod: true, isYear: false };
  }
  
  if (monthStr === 'all') {
    return { month: 0, year: parseInt(yearStr), isAllPeriod: false, isYear: true };
  }
  
  if (monthStr) {
    return { month: parseInt(monthStr), year: parseInt(yearStr), isAllPeriod: false, isYear: false };
  }
  
  // Apenas ano selecionado sem mês - treated as full year
  return { month: 0, year: parseInt(yearStr), isAllPeriod: false, isYear: true };
}

export function BudgetsPageClient({ categories }: BudgetsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);

  const { month, year, isAllPeriod, isYear } = parseMonthParams(yearParam, monthParam);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (isAllPeriod) {
        params.set('all', 'true');
      } else if (isYear) {
        params.set('year', String(year));
      } else if (month > 0 && year > 0) {
        params.set('month', String(month));
        params.set('year', String(year));
      } else {
        const now = new Date();
        params.set('month', String(now.getMonth() + 1));
        params.set('year', String(now.getFullYear()));
      }
      
      const url = `/api/budgets?${params.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, isAllPeriod, isYear, monthParam]);

  useEffect(() => {
    fetchBudgets();
  }, [month, year, isAllPeriod, isYear]);

  const handleSuccess = async () => {
    await fetchBudgets();
  };

  const handleEdit = (budget: BudgetData) => {
    setEditingBudget({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      alertAt80: budget.alertAt80,
      alertAt100: budget.alertAt100,
      category: budget.category,
    });
    setIsDialogOpen(true);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <MonthSelector />
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

      <div className="text-sm text-muted-foreground">
        {isAllPeriod ? (
          <>Exibindo todos os orçamentos</>
        ) : isYear ? (
          <>Exibindo orçamentos de <span className="font-medium">{year}</span></>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="bg-muted h-4 w-24 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-16 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length > 0 ? (
        <BudgetWidget
          budgets={budgets}
          onEdit={handleEdit}
          onSuccess={handleSuccess}
          showPeriod={isAllPeriod || isYear}
        />
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