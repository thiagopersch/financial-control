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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { upsertBudget } from '@/lib/actions/budgets';
import { useState } from 'react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface Budget {
  id?: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertAt80: boolean;
  alertAt100: boolean;
}

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  editingBudget?: Budget | null;
  onSuccess?: () => void;
}

export function BudgetDialog({
  open,
  onOpenChange,
  categories,
  editingBudget,
  onSuccess,
}: BudgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const now = new Date();

  const [formData, setFormData] = useState<Budget>({
    categoryId: editingBudget?.categoryId || '',
    amount: editingBudget?.amount || 0,
    month: editingBudget?.month || now.getMonth() + 1,
    year: editingBudget?.year || now.getFullYear(),
    alertAt80: editingBudget?.alertAt80 ?? true,
    alertAt100: editingBudget?.alertAt100 ?? true,
  });

  const generateYears = () => {
    const years = [];
    for (let i = now.getFullYear(); i <= now.getFullYear() + 15; i++) {
      years.push(i);
    }
    return years;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error('Selecione uma categoria', {
        description: 'Por favor, selecione uma categoria para o orçamento.',
        position: 'bottom-center',
        richColors: true,
      });
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Valor deve ser maior que zero', {
        description: 'Por favor, insira um valor maior que zero.',
        position: 'bottom-center',
        richColors: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await upsertBudget(formData);
      if (result.success) {
        toast.success(editingBudget ? 'Orçamento atualizado' : 'Orçamento criado', {
          description: editingBudget
            ? 'Orçamento atualizado com sucesso.'
            : 'Orçamento criado com sucesso.',
          position: 'bottom-center',
          richColors: true,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erro ao salvar orçamento', {
          description: result.error || 'Erro ao salvar orçamento.',
          position: 'bottom-center',
          richColors: true,
        });
      }
    } catch (error) {
      toast.error('Erro ao salvar orçamento', {
        description: 'Erro ao salvar orçamento.',
        position: 'bottom-center',
        richColors: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Configurar Orçamento'}</DialogTitle>
          <DialogDescription>
            Defina um limite de gastos para uma categoria neste mês.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Valor do Orçamento</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0,00"
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="month">Mês</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(2000, m - 1)
                          .toLocaleDateString('pt-BR', { month: 'long' })
                          .charAt(0)
                          .toUpperCase() +
                          new Date(2000, m - 1)
                            .toLocaleDateString('pt-BR', { month: 'long' })
                            .slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">Ano</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYears().map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="alert80">Alertar aos 80%</Label>
              <Switch
                id="alert80"
                checked={formData.alertAt80}
                onCheckedChange={(checked) => setFormData({ ...formData, alertAt80: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="alert100">Alertar ao estourar</Label>
              <Switch
                id="alert100"
                checked={formData.alertAt100}
                onCheckedChange={(checked) => setFormData({ ...formData, alertAt100: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingBudget ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
