'use client';

import { GoalsWidget } from '@/components/dashboard/goals-widget';
import { GoalDialog, Goal } from '@/components/goals/goal-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Rocket, Target } from 'lucide-react';
import { useState } from 'react';
import { deleteGoal } from '@/lib/actions/goals';
import { toast } from 'sonner';
import type { GoalData } from '@/types/goal';

interface GoalsPageClientProps {
  initialGoals: GoalData[];
}

export function GoalsPageClient({ initialGoals }: GoalsPageClientProps) {
  const [goals, setGoals] = useState<GoalData[]>(initialGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleEdit = (goal: GoalData) => {
    setEditingGoal({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : null,
      color: goal.color || '#0ea5e9',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      const result = await deleteGoal(goalId);
      if (result.success) {
        toast.success('Meta excluída com sucesso');
        setGoals(goals.filter((g) => g.id !== goalId));
      } else {
        toast.error(result.error || 'Erro ao excluir meta');
      }
    } catch (error) {
      toast.error('Erro ao excluir meta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          className="gap-2"
          onClick={() => {
            setEditingGoal(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {goals.length > 0 ? (
          goals.map((goal) => (
            <div key={goal.id} className="lg:col-span-1">
              <GoalsWidget goals={[goal]} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          ))
        ) : (
          <Card className="col-span-full py-20">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-muted rounded-full p-4">
                <Target className="text-muted-foreground h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Qual seu próximo sonho?</h3>
                <p className="text-muted-foreground mx-auto max-w-xs">
                  Seja uma reserva de emergência, uma viagem ou um novo carro, definir metas é o
                  primeiro passo para conquistar.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => {
                  setEditingGoal(null);
                  setIsDialogOpen(true);
                }}
              >
                <Rocket className="h-4 w-4" />
                Criar minha primeira meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <GoalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingGoal={editingGoal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
