'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  categorySchema,
  useCategoryForm,
  type CategoryFormValues,
} from '@/hooks/forms/use-category-form';
import type { CategoryDTO } from '@/lib/queries/categories';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionType } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface CategoriesFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryDTO | null;
  onSuccess?: () => void;
}

export function CategoriesForm({ isOpen, onClose, category, onSuccess }: CategoriesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useCategoryForm({
    category,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<CategoryFormValues>(() => {
    if (category) {
      return {
        name: category.name,
        type: category.type,
        color: category.color || '#3b82f6',
      };
    }
    return {
      name: '',
      type: TransactionType.EXPENSE,
      color: '#3b82f6',
    };
  }, [category]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultValues]);

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Categoria' : 'Nova Categoria'}
      description="Defina o nome, tipo e cor da categoria para organizar suas finanças."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Alimentação, Aluguel..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                  </SelectContent>
                </Select>
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
                  <div className="flex items-center gap-2">
                    <Input type="color" className="h-10 w-16 p-1" {...field} />
                    <span className="text-muted-foreground font-mono text-sm">{field.value}</span>
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
