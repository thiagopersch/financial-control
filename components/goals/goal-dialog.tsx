'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGoal, updateGoal } from '@/lib/actions/goals';
import { showError, showSuccess, showValidationErrors } from '@/lib/utils/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

export interface Goal {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | string | null;
  color: string;
}

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal?: Goal | null;
  onSuccess?: () => void;
}

const colorOptions = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  currentAmount: z.string(),
  targetAmount: z
    .string()
    .min(1, 'Valor alvo é obrigatório')
    .refine((val) => parseFloat(val) > 0, 'Valor alvo deve ser maior que zero'),
  deadline: z.coerce.date().nullable().optional(),
  color: z.string(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export function GoalDialog({ open, onOpenChange, editingGoal, onSuccess }: GoalDialogProps) {
  const form = useForm<GoalFormValues>({
    defaultValues: {
      name: '',
      currentAmount: '0',
      targetAmount: '',
      deadline: undefined,
      color: '#0ea5e9',
    },
  });

  useEffect(() => {
    if (open) {
      const parseDate = (d: string | Date | null | undefined) => {
        if (!d) return undefined;
        if (d instanceof Date) return d;
        if (typeof d === 'string') {
          const date = new Date(d);
          return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
      };

      if (editingGoal) {
        form.reset({
          name: editingGoal.name || '',
          currentAmount: String(editingGoal.currentAmount || 0),
          targetAmount: String(editingGoal.targetAmount || 0),
          deadline: parseDate(editingGoal.deadline),
          color: editingGoal.color || '#0ea5e9',
        });
      } else {
        form.reset({
          name: '',
          currentAmount: '0',
          targetAmount: '',
          deadline: undefined,
          color: '#0ea5e9',
        });
      }
    }
  }, [open, editingGoal, form]);

  const onSubmit = async (data: GoalFormValues) => {
    const result = goalSchema.safeParse(data);

    if (!result.success) {
      showValidationErrors(result.error);
      return;
    }

    try {
      const payload = {
        name: data.name,
        currentAmount: parseFloat(data.currentAmount),
        targetAmount: parseFloat(data.targetAmount),
        deadline: data.deadline || null,
        color: data.color,
      };

      let actionResult;
      if (editingGoal?.id) {
        actionResult = await updateGoal(editingGoal.id, payload);
      } else {
        actionResult = await createGoal(payload);
      }

      if (actionResult.success) {
        showSuccess(
          editingGoal ? 'Meta atualizada' : 'Meta criada',
          editingGoal ? 'Meta atualizada com sucesso' : 'Meta criada com sucesso',
        );
        onOpenChange(false);
        form.reset();
        onSuccess?.();
      } else {
        showError('Erro ao salvar meta', actionResult.error);
      }
    } catch (error) {
      showError('Erro ao salvar meta');
    }
  };

  const selectedColor = form.watch('color') || '#0ea5e9';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          <DialogDescription>Defina uma nova meta financeira para alcançar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Meta</Label>
              <Input id="name" {...form.register('name')} placeholder="Ex: Viagem para Disney" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentAmount">Valor Atual</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('currentAmount')}
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
                  {...form.register('targetAmount')}
                  placeholder="0,00"
                />
                {form.formState.errors.targetAmount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.targetAmount.message}
                  </p>
                )}
              </div>
            </div>

            <Controller
              name="deadline"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="deadline">Prazo (opcional)</FieldLabel>
                  <DatePicker
                    date={field.value ?? undefined}
                    setDate={(date) => field.onChange(date ?? null)}
                    placeholder="Selecione uma data"
                  />
                  <FieldError errors={[form.formState.errors.deadline]} />
                </Field>
              )}
            />

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-transform ${
                      selectedColor === color ? 'ring-primary scale-110 ring-2 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => form.setValue('color', color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : editingGoal ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
