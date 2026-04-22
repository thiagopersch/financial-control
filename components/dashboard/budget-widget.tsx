'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle2, MoreHorizontal, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

const monthNames = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function getMonthName(month: number): string {
  return monthNames[month - 1] || '';
}

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
  spent?: number;
  percent?: number;
}

interface BudgetCardProps {
  budget: BudgetData;
  showPeriod?: boolean;
  onEdit?: (budget: BudgetData) => void;
  onDelete?: (budget: BudgetData) => void;
}

function BudgetCard({ budget, showPeriod = false, onEdit, onDelete }: BudgetCardProps) {
  const isOver = budget.percent !== undefined && budget.percent >= 100;
  const isWarning = budget.percent !== undefined && budget.percent >= 80 && budget.percent < 100;

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={cn('from-background to-muted/20 bg-linear-to-br transition-all hover:shadow-md')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: budget.category?.color }}
            />
            <CardTitle className="text-base">{budget.category?.name}</CardTitle>
          </div>
          {showPeriod && (
            <span className="text-muted-foreground text-xs">
              {getMonthName(budget.month)}/{budget.year}
            </span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleOpenMenu}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(budget)}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(budget);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gasto</span>
            <span className="font-medium">{formatCurrency(budget.spent || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Orçamento</span>
            <span className="font-medium">{formatCurrency(budget.amount)}</span>
          </div>
        </div>
        <div className="space-y-1">
          <Progress
            value={Math.min(budget.percent || 0, 100)}
            className={cn(
              'h-2',
              isOver
                ? '[&>div]:bg-rose-500'
                : isWarning
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-emerald-500',
            )}
          />
          <div className="flex items-center justify-between text-xs font-bold tracking-tight uppercase">
            <span
              className={cn(
                isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600',
              )}
            >
              {budget.percent?.toFixed(0) || 0}%
            </span>
            {isOver ? (
              <span className="flex items-center gap-1 text-rose-600">
                <AlertCircle size={10} /> Estourado
              </span>
            ) : isWarning ? (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle size={10} /> Alerta
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={10} /> Ok
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BudgetWidgetProps {
  budgets: BudgetData[];
  showPeriod?: boolean;
  onEdit?: (budget: BudgetData) => void;
  onDelete?: (budget: BudgetData) => void;
  onSuccess?: () => void;
}

export function BudgetWidget({
  budgets,
  showPeriod = false,
  onEdit,
  onDelete,
  onSuccess,
}: BudgetWidgetProps) {
  const isSingleBudget = budgets.length === 1;

  const handleClick = (e: React.MouseEvent) => {
    if (onEdit && budgets.length === 1) {
      e.preventDefault();
      onEdit(budgets[0]);
    }
  };

  if (budgets.length === 0) {
    return (
      <Link href="/budgets" className="block h-full w-full">
        <Card className="h-full w-full cursor-pointer transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Orçamentos</CardTitle>
            <CardDescription>Acompanhe seus limites por categoria.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-muted mb-3 rounded-full p-3">
              <AlertCircle className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhum orçamento definido para este período.
            </p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (isSingleBudget && (onEdit || onDelete)) {
    return (
      <div className="grid h-full w-full gap-4">
        <BudgetCard
          budget={budgets[0]}
          showPeriod={showPeriod}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }

  if (budgets.length === 1) {
    return (
      <div className="grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-1">
        <BudgetCard
          budget={budgets[0]}
          showPeriod={showPeriod}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          showPeriod={showPeriod}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
