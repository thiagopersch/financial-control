'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import type { GoalData } from '@/types/goal';
import { Plus, Target, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface GoalsWidgetProps {
  goals: GoalData[];
  onEdit?: (goal: GoalData) => void;
  onDelete?: (goalId: string) => void;
  onDeleteClick?: (goalId: string) => void;
  onDeposit?: (goalId: string) => void;
}

export function GoalsWidget({
  goals,
  onEdit,
  onDelete,
  onDeleteClick,
  onDeposit,
}: GoalsWidgetProps) {
  const isSingleGoal = goals.length === 1;
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (onEdit && goals.length === 1) {
      e.preventDefault();
      onEdit(goals[0]);
    }
  };

  const handleDepositClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeposit && goals.length === 1) {
      onDeposit(goals[0].id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteClick && goals.length === 1) {
      onDeleteClick(goals[0].id);
    } else if (onDelete && goals.length === 1) {
      onDelete(goals[0].id);
    }
  };

  if (goals.length === 0)
    return (
      <Link href="/goals" className="block h-full w-full">
        <Card className="h-full w-full cursor-pointer transition-all hover:shadow-md">
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
      </Link>
    );

  if (isSingleGoal && onEdit) {
    return (
      <div
        className="group relative grid h-full w-full cursor-pointer gap-4"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="border-primary/20 h-full w-full overflow-hidden shadow-sm transition-all hover:shadow-md">
          {onDeposit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDepositClick}
                  className={`bg-primary hover:bg-primary/90 absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition-all ${
                    isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                  title="Depositar"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Depositar na meta</TooltipContent>
            </Tooltip>
          )}

          {onDeleteClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDeleteClick}
                  className={`bg-destructive hover:bg-destructive/90 absolute top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition-all ${
                    onDeposit ? 'right-14' : 'right-2'
                  } ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                  title="Excluir"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir meta</TooltipContent>
            </Tooltip>
          )}

          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="text-primary h-5 w-5" />
              <span className="text-base">{goals[0].name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-primary text-sm font-bold">{goals[0].percent.toFixed(0)}%</span>
            </div>

            <Progress value={goals[0].percent} className="bg-primary/10 [&>div]:bg-primary h-3" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Atingido:{' '}
                <span className="font-semibold">{formatCurrency(goals[0].currentAmount)}</span>
              </span>
              <span className="text-muted-foreground">
                Alvo: <span className="font-semibold">{formatCurrency(goals[0].targetAmount)}</span>
              </span>
            </div>

            {goals[0].targetAmount > goals[0].currentAmount && (
              <div className="bg-primary/5 border-primary/10 flex items-center gap-2 rounded-md border p-2">
                <TrendingUp size={12} className="text-primary" />
                <span className="text-primary/80 text-[10px] font-medium">
                  Faltam {formatCurrency(goals[0].targetAmount - goals[0].currentAmount)} para o
                  objetivo.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Link href="/goals" className="block h-full w-full">
      <div className="grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {goals.slice(0, 3).map((goal) => (
          <Card
            key={goal.id}
            className="border-primary/20 h-full w-full cursor-pointer overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Target className="text-primary h-5 w-5" />
                <span className="text-base">{goal.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary text-sm font-bold">{goal.percent.toFixed(0)}%</span>
              </div>

              <Progress value={goal.percent} className="bg-primary/10 [&>div]:bg-primary h-3" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Atingido:{' '}
                  <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
                </span>
                <span className="text-muted-foreground">
                  Alvo: <span className="font-semibold">{formatCurrency(goal.targetAmount)}</span>
                </span>
              </div>

              {goal.targetAmount > goal.currentAmount && (
                <div className="bg-primary/5 border-primary/10 flex items-center gap-2 rounded-md border p-2">
                  <TrendingUp size={12} className="text-primary" />
                  <span className="text-primary/80 text-[10px] font-medium">
                    Faltam {formatCurrency(goal.targetAmount - goal.currentAmount)} para o objetivo.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Link>
  );
}
