'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createRule, updateRule } from '@/lib/actions/rules';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  categories: { id: string; name: string; type: string }[];
  initialData?: any;
}

export function RuleModal({ isOpen, onClose, categories, initialData }: RuleModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { keyword: '', categoryId: '' },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({ keyword: initialData.keyword, categoryId: initialData.categoryId });
    } else {
      form.reset({ keyword: '', categoryId: '' });
    }
  }, [initialData, form]);

  async function onSubmit(data: RuleFormValues) {
    setIsLoading(true);
    try {
      const result = initialData ? await updateRule(initialData.id, data) : await createRule(data);

      if (result.success) {
        showSuccess(initialData ? 'Regra atualizada!' : 'Regra criada com sucesso!');
        onClose();
      } else {
        showError(result.error || 'Erro inesperado.');
      }
    } catch {
      showError('Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Regra' : 'Nova Regra de Categorização'}</DialogTitle>
          <DialogDescription>
            Quando uma transação contiver esta palavra-chave na descrição, ela será categorizada
            automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.type === 'INCOME' ? 'Receita' : 'Despesa'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Salvar' : 'Criar regra'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
