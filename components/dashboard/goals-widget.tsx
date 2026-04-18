'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import type { GoalData } from '@/types/goal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MoreHorizontal, Pencil, Target, Trash2, TrendingUp } from 'lucide-react';

interface GoalsWidgetProps {
  goals: GoalData[];
  onEdit?: (goal: GoalData) => void;
  onDelete?: (goalId: string) => void;
}

export function GoalsWidget({ goals, onEdit, onDelete }: GoalsWidgetProps) {
  const handleEditClick = (e: React.MouseEvent, goal: GoalData) => {
    e.stopPropagation();
    onEdit?.(goal);
  };

  const handleDeleteClick = (e: React.MouseEvent, goalId: string) => {
    e.stopPropagation();
    onDelete?.(goalId);
  };

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
    <>
      {goals.map((goal) => (
        <Card
          key={goal.id}
          className="border-primary/20 col-span-full overflow-hidden shadow-sm xl:col-span-1"
        >
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Target className="text-primary h-5 w-5" />
                <span className="text-base">{goal.name}</span>
              </CardTitle>
              {goal.deadline && (
                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px] font-medium uppercase">
                  <Calendar size={10} />
                  Prazo: {format(new Date(goal.deadline), "MMMM 'y'", { locale: ptBR })}
                </div>
              )}
            </div>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => handleEditClick(e, goal)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteClick(e, goal.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary text-sm font-bold">{goal.percent.toFixed(0)}%</span>
              </div>

              <Progress value={goal.percent} className="bg-primary/10 [&>div]:bg-primary h-3" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Atingido:{' '}
                  <span className="text-foreground font-semibold">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Alvo:{' '}
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
          </CardContent>
        </Card>
      ))}
    </>
  );
}
