'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGoal, updateGoal } from '@/lib/actions/goals';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface Goal {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  color: string;
}

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal?: Goal | null;
  onSuccess?: () => void;
}

const colorOptions = [
  '#0ea5e9', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function GoalDialog({ open, onOpenChange, editingGoal, onSuccess }: GoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Goal>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    color: '#0ea5e9',
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        id: editingGoal.id,
        name: editingGoal.name || '',
        targetAmount: editingGoal.targetAmount || 0,
        currentAmount: editingGoal.currentAmount || 0,
        deadline: editingGoal.deadline || '',
        color: editingGoal.color || '#0ea5e9',
      });
    } else {
      setFormData({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        deadline: '',
        color: '#0ea5e9',
      });
    }
  }, [editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (formData.targetAmount <= 0) {
      toast.error('Valor alvo deve ser maior que zero');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
      };

      let result;
      if (editingGoal?.id) {
        result = await updateGoal(editingGoal.id, data);
      } else {
        result = await createGoal(data);
      }

      if (result.success) {
        toast.success(editingGoal ? 'Meta atualizada' : 'Meta criada', {
          description: editingGoal ? 'Meta atualizada com sucesso' : 'Meta criada com sucesso',
          position: 'bottom-center',
          richColors: true,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erro ao salvar meta', {
          description: editingGoal ? 'Erro ao atualizar meta' : 'Erro ao criar meta',
          position: 'bottom-center',
          richColors: true,
        });
      }
    } catch (error) {
      toast.error('Erro ao salvar meta', {
        description: editingGoal ? 'Erro ao atualizar meta' : 'Erro ao criar meta',
        position: 'bottom-center',
        richColors: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          <DialogDescription>Defina uma nova meta financeira para alcançar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Meta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Viagem para Disney"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentAmount">Valor Atual</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Valor Alvo</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deadline">Prazo (opcional)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value || null })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-transform ${
                      formData.color === color ? 'ring-primary scale-110 ring-2 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingGoal ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
