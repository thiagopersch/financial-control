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
import { useRuleForm } from '@/hooks/forms/use-rule-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const ruleSchema = z.object({
  keyword: z.string().min(2, 'Palavra-chave deve ter pelo menos 2 caracteres'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; type: string; color: string }[];
  initialData?: any;
}

export function RuleModal({ isOpen, onClose, categories, initialData }: RuleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useRuleForm({
    rule: initialData || null,
    onSuccess: () => {
      onClose();
    },
  });

  const defaultValues = useMemo<RuleFormValues>(() => {
    if (initialData) {
      return {
        keyword: initialData.keyword,
        categoryId: initialData.categoryId,
      };
    }
    return { keyword: '', categoryId: '' };
  }, [initialData]);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (values: RuleFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Regra' : 'Nova Regra de Categorização'}
      description="Quando uma transação contiver esta palavra-chave na descrição, ela será categorizada automaticamente."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText={isEditing ? 'Salvar' : 'Criar regra'}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Palavra-chave</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: mercado, uber, aluguel..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria associada</FormLabel>
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
                          <span className="text-muted-foreground text-xs">
                            ({cat.type === 'INCOME' ? 'Receita' : 'Despesa'})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}
