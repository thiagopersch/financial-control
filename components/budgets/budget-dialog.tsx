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
import { upsertBudget } from '@/lib/actions/budgets';
import { showError, showSuccess, showValidationErrors } from '@/lib/utils/toast';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Category {
  id: string;
  name: string;
  color: string;
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
  month: z.string().min(1, 'Mês é obrigatório'),
  year: z.string().min(1, 'Ano é obrigatório'),
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

  const months = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    value: m.toString(),
    label:
      new Date(2000, m - 1).toLocaleDateString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() +
      new Date(2000, m - 1).toLocaleDateString('pt-BR', { month: 'long' }).slice(1),
  }));

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

      const actionResult = await upsertBudget({ ...payload, id: editingBudget?.id });
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {categories.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name}
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
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">{type.label}</div>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {generateYears().map((type) => (
                        <SelectItem key={type} value={type.toString()}>
                          <div className="flex items-center gap-2">{type}</div>
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
              name="alertAt80"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alertar aos 80%</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alertAt100"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alertar ao estourar</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Salvando...'
                  : editingBudget
                    ? 'Atualizar'
                    : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
