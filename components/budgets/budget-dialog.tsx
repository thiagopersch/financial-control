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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { budgetSchema, useBudgetForm } from '@/hooks/forms/use-budget-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  editingBudget?: any | null;
  onSuccess?: () => void;
}

export function BudgetDialog({
  open,
  onOpenChange,
  categories,
  editingBudget,
  onSuccess,
}: BudgetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useBudgetForm({
    budget: editingBudget || null,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const defaultValues = useMemo(() => {
    const now = new Date();
    if (editingBudget) {
      return {
        categoryId: editingBudget.categoryId || '',
        amount: editingBudget.amount || 0,
        month: editingBudget.month || now.getMonth() + 1,
        year: editingBudget.year || now.getFullYear(),
        alertAt80: editingBudget.alertAt80 ?? true,
        alertAt100: editingBudget.alertAt100 ?? true,
      };
    }
    return {
      categoryId: '',
      amount: 0,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      alertAt80: true,
      alertAt100: true,
    };
  }, [editingBudget]);

  const form = useForm({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const now = new Date();

  const generateYears = () => {
    const years = [];
    for (let i = now.getFullYear(); i <= now.getFullYear() + 15; i++) {
      years.push(i);
    }
    return years;
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    value: m,
    label:
      new Date(2000, m - 1).toLocaleDateString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() +
      new Date(2000, m - 1).toLocaleDateString('pt-BR', { month: 'long' }).slice(1),
  }));

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Orçamento' : 'Configurar Orçamento'}
      description="Defina um limite de gastos para uma categoria neste mês."
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText={isEditing ? 'Atualizar' : 'Salvar'}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Orçamento</FormLabel>
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
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {generateYears().map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="alertAt80"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Alertar aos 80%</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alertAt100"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Alertar ao estourar</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}
