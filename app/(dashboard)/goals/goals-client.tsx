'use client';

import { GoalsWidget } from '@/components/dashboard/goals-widget';
import { DepositDialog } from '@/components/goals/deposit-dialog';
import { type Goal, GoalDialog } from '@/components/goals/goal-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { deleteGoal } from '@/lib/actions/goals';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { GoalData } from '@/types/goal';
import { Plus, Rocket, Target } from 'lucide-react';
import { useState } from 'react';

interface GoalsPageClientProps {
  initialGoals: GoalData[];
}

export function GoalsPageClient({ initialGoals }: GoalsPageClientProps) {
  const [goals, setGoals] = useState<GoalData[]>(initialGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

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
    try {
      const result = await deleteGoal(goalId);
      if (result.success) {
        showSuccess('Meta excluída com sucesso');
        setGoals(goals.filter((g) => g.id !== goalId));
      } else {
        showError(result.error || 'Erro ao excluir meta');
      }
    } catch {
      showError('Erro ao excluir meta');
    }
  };

  const handleDeleteClick = (goalId: string) => {
    setDeleteGoalId(goalId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGoalId) return;

    try {
      const result = await deleteGoal(deleteGoalId);
      if (result.success) {
        showSuccess('Meta excluída com sucesso');
        setGoals(goals.filter((g) => g.id !== deleteGoalId));
        setDeleteGoalId(null);
      } else {
        showError(result.error || 'Erro ao excluir meta');
      }
    } catch {
      showError('Erro ao excluir meta');
    }
  };

  const handleDeposit = (goalId: string) => {
    setDepositGoalId(goalId);
  };

  const handleDepositSuccess = (newAmount: number) => {
    setGoals(
      goals.map((g) =>
        g.id === depositGoalId
          ? {
              ...g,
              currentAmount: newAmount,
              percent: Math.min((newAmount / g.targetAmount) * 100, 100),
            }
          : g,
      ),
    );
  };

  const currentDepositGoal = goals.find((g) => g.id === depositGoalId);

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
              <GoalsWidget
                goals={[goal]}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDeleteClick={handleDeleteClick}
                onDeposit={handleDeposit}
              />
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

      {currentDepositGoal && (
        <DepositDialog
          open={depositGoalId !== null}
          onOpenChange={(open) => !open && setDepositGoalId(null)}
          goalId={currentDepositGoal.id}
          goalName={currentDepositGoal.name}
          currentAmount={currentDepositGoal.currentAmount}
          targetAmount={currentDepositGoal.targetAmount}
          onDepositSuccess={handleDepositSuccess}
        />
      )}

      {deleteGoalId && (
        <DeleteConfirmModal
          isOpen={deleteGoalId !== null}
          onClose={() => setDeleteGoalId(null)}
          onConfirm={handleDeleteConfirm}
          title="Excluir Meta"
          description={`Tem certeza que deseja excluir a meta "${
            goals.find((g) => g.id === deleteGoalId)?.name || ''
          }"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
