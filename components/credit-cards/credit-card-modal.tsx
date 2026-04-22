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
import { createCreditCard, updateCreditCard } from '@/lib/actions/credit-cards';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const creditCardSchema = z.object({
  limit: z.string().min(1, 'Limite é obrigatório'),
  initialBalance: z.coerce.number().default(0),
  closingDay: z.coerce.number().min(1, 'Dia de fechamento é obrigatório').max(31, 'Dia inválido'),
  dueDay: z.coerce.number().min(1, 'Dia de vencimento é obrigatório').max(31, 'Dia inválido'),
  accountId: z.string().min(1, 'Conta vinculada é obrigatória'),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type CreditCardFormData = z.infer<typeof creditCardSchema>;

interface Account {
  id: string;
  name: string;
  color?: string;
}

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  creditCard?: CreditCardFormData & { id?: string; account?: Account };
  accounts: Account[];
}

export function CreditCardModal({
  isOpen,
  onClose,
  onSuccess,
  creditCard,
  accounts,
}: CreditCardModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema) as any,
    defaultValues: {
      limit: '',
      initialBalance: 0,
      closingDay: 0,
      dueDay: 0,
      accountId: '',
      color: '#6366f1',
    },
  });

  useEffect(() => {
    if (creditCard) {
      form.reset({
        limit: String(creditCard.limit),
        initialBalance: Number(creditCard.initialBalance) || 0,
        closingDay: creditCard.closingDay,
        dueDay: creditCard.dueDay,
        accountId: creditCard.accountId,
        color: creditCard.color || '#6366f1',
      });
    } else {
      form.reset({
        limit: '',
        initialBalance: 0,
        closingDay: 0,
        dueDay: 0,
        accountId: '',
        color: '#6366f1',
      });
    }
  }, [creditCard, form, isOpen]);

  async function onSubmit(values: CreditCardFormData) {
    setLoading(true);
    try {
      const parsed = creditCardSchema.safeParse(values);
      if (!parsed.success) {
        showError('Dados inválidos');
        return;
      }

      const data = {
        limit: parseFloat(parsed.data.limit),
        initialBalance: parsed.data.initialBalance,
        closingDay: parsed.data.closingDay,
        dueDay: parsed.data.dueDay,
        accountId: parsed.data.accountId,
        color: parsed.data.color,
      };

      if (creditCard?.id) {
        const result = await updateCreditCard(creditCard.id, data);
        if (result.success) {
          showSuccess('Cartão atualizado com sucesso');
          onClose();
          onSuccess?.();
        } else {
          showError(result.error || 'Erro ao atualizar cartão');
        }
      } else {
        const result = await createCreditCard(data);
        if (result.success) {
          showSuccess('Cartão criado com sucesso');
          onClose();
          onSuccess?.();
        } else {
          showError(result.error || 'Erro ao criar cartão');
        }
      }
    } catch {
      showError('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{creditCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}</DialogTitle>
          <DialogDescription>
            {creditCard
              ? 'Atualize os dados do cartão de crédito'
              : 'Cadastre um novo cartão de crédito'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Fechamento</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Vinculada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: account.color }}
                            />
                            {account.name}
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="h-10 w-20 p-1" {...field} />
                      <span className="text-muted-foreground text-xs">Identificador visual</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {creditCard ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
