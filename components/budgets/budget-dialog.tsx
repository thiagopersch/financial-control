'use client';

import { useEffect } from 'react';
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
import { showError, showSuccess, showValidationErrors } from '@/lib/utils/toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z
    .string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => parseFloat(val) > 0, 'Valor deve ser maior que zero'),
  month: z.string(),
  year: z.string(),
  alertAt80: z.boolean(),
  alertAt100: z.boolean(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export function BudgetDialog({
  open,
  onOpenChange,
  categories,
  editingBudget,
  onSuccess,
}: BudgetDialogProps) {
  const form = useForm<BudgetFormValues>({
    defaultValues: {
      categoryId: editingBudget?.categoryId || '',
      amount: editingBudget?.amount?.toString() || '',
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      alertAt80: editingBudget?.alertAt80 ?? true,
      alertAt100: editingBudget?.alertAt100 ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      const now = new Date();
      if (editingBudget) {
        form.reset({
          categoryId: editingBudget.categoryId || '',
          amount: String(editingBudget.amount || ''),
          month: String(editingBudget.month || now.getMonth() + 1),
          year: String(editingBudget.year || now.getFullYear()),
          alertAt80: editingBudget.alertAt80 ?? true,
          alertAt100: editingBudget.alertAt100 ?? true,
        });
      } else {
        form.reset({
          categoryId: '',
          amount: '',
          month: String(now.getMonth() + 1),
          year: String(now.getFullYear()),
          alertAt80: true,
          alertAt100: true,
        });
      }
    }
  }, [open, editingBudget, form]);

  const now = new Date();

  const generateYears = () => {
    const years = [];
    for (let i = now.getFullYear(); i <= now.getFullYear() + 15; i++) {
      years.push(i);
    }
    return years;
  };

  const onSubmit = async (data: BudgetFormValues) => {
    const result = budgetSchema.safeParse(data);

    if (!result.success) {
      showValidationErrors(result.error);
      return;
    }

    try {
      const payload = {
        categoryId: data.categoryId,
        amount: parseFloat(data.amount),
        month: parseInt(data.month),
        year: parseInt(data.year),
        alertAt80: data.alertAt80,
        alertAt100: data.alertAt100,
      };

      const actionResult = await upsertBudget(payload);
      if (actionResult.success) {
        showSuccess(
          editingBudget ? 'Orçamento atualizado' : 'Orçamento criado',
          editingBudget ? 'Orçamento atualizado com sucesso.' : 'Orçamento criado com sucesso.',
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        showError('Erro ao salvar orçamento', actionResult.error);
      }
    } catch (error) {
      showError('Erro ao salvar orçamento');
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(value) => form.setValue('categoryId', value)}
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
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Valor do Orçamento</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...form.register('amount')}
                placeholder="0,00"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="month">Mês</Label>
                <Select
                  value={form.watch('month')}
                  onValueChange={(value) => form.setValue('month', value)}
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
                  value={form.watch('year')}
                  onValueChange={(value) => form.setValue('year', value)}
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
                checked={form.watch('alertAt80')}
                onCheckedChange={(checked) => form.setValue('alertAt80', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="alert100">Alertar ao estourar</Label>
              <Switch
                id="alert100"
                checked={form.watch('alertAt100')}
                onCheckedChange={(checked) => form.setValue('alertAt100', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : editingBudget ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
