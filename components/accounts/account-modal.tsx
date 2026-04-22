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
import { createAccount, updateAccount } from '@/lib/actions/accounts';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Account, AccountType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const accountType: { value: AccountType; label: string }[] = [
  { value: AccountType.PIX, label: 'PIX' },
  { value: AccountType.CREDIT_CARD, label: 'Cartão de Crédito' },
  { value: AccountType.DEBIT_CARD, label: 'Cartão de Débito' },
  { value: AccountType.BANK, label: 'Banco' },
  { value: AccountType.WALLET, label: 'Carteira' },
  { value: AccountType.INVESTMENT, label: 'Investimento' },
  { value: AccountType.CRYPTO, label: 'Cripto' },
  { value: AccountType.OTHERS, label: 'Outros' },
];

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(AccountType),
  color: z.string().default('#000000'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

export function AccountModal({ isOpen, onClose, account }: AccountModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: '',
      type: AccountType.PIX,
      color: '#000000',
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        color: account.color || '#000000',
      });
    } else {
      form.reset({
        name: '',
        type: AccountType.PIX,
        color: '#000000',
      });
    }
  }, [account, form, isOpen]);

  async function onSubmit(values: AccountFormValues) {
    setLoading(true);
    try {
      if (account) {
        const result = await updateAccount(account.id, values);
        if (result.success) {
          showSuccess('Conta atualizada com sucesso', 'A conta foi atualizada com sucesso');
          onClose();
        } else {
          showError('Erro ao atualizar conta', result.error || 'A conta não foi atualizada');
        }
      } else {
        const result = await createAccount(values);
        if (result.success) {
          showSuccess('Conta criada com sucesso', 'A conta foi criada com sucesso');
          onClose();
        } else {
          showError('Erro ao criar conta', result.error || 'A conta não foi criada');
        }
      }
    } catch (error) {
      showError('Ocorreu um erro inesperado', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          <DialogDescription>Insira os detalhes da conta abaixo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank, Banco do Brasil, Sicoob" {...field} />
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
                      {accountType.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                  <FormLabel>
                    Cor
                    <span className="text-muted-foreground text-xs">Identificador visual</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="h-10 w-30 p-1" {...field} />
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
                {account ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
