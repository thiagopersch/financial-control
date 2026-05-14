'use client';

import { FormDialog } from '@/components/ui/form-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { goalSchema, useGoalForm } from '@/hooks/forms/use-goal-form';
import type { GoalDTO } from '@/lib/queries/goals';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

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

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal?: any | null;
  onSuccess?: () => void;
}

export function GoalDialog({ open, onOpenChange, editingGoal, onSuccess }: GoalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useGoalForm({
    goal: editingGoal || null,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const defaultValues = useMemo(() => {
    if (editingGoal) {
      return {
        name: editingGoal.name || '',
        targetAmount: editingGoal.targetAmount || 0,
        currentAmount: editingGoal.currentAmount || 0,
        deadline: editingGoal.deadline ? new Date(editingGoal.deadline) : null,
        color: editingGoal.color || '#0ea5e9',
      };
    }
    return {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: null as Date | null,
      color: '#0ea5e9',
    };
  }, [editingGoal]);

  const form = useForm({
    resolver: zodResolver(goalSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const selectedColor = form.watch('color') || '#0ea5e9';

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Meta' : 'Nova Meta'}
      description="Defina uma nova meta financeira para alcançar."
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText={isEditing ? 'Atualizar' : 'Criar'}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Meta</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Viagem para Disney" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Atual</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Alvo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Controller
            name="deadline"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo (opcional)</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ?? undefined}
                    setDate={(date) => field.onChange(date ?? null)}
                    placeholder="Selecione uma data"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full transition-transform ${
                          selectedColor === color
                            ? 'ring-primary scale-110 ring-2 ring-offset-2'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}
