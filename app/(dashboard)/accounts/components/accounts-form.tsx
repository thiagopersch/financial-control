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
import { Separator } from '@/components/ui/separator';
import {
  accountSchema,
  useAccountForm,
  type AccountFormValues,
} from '@/hooks/forms/use-account-form';
import type { AccountDTO } from '@/lib/queries/accounts';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccountType } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface AccountsFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: AccountDTO | null;
  onSuccess?: () => void;
}

type AccountTypeOption = {
  value: AccountType;
  label: string;
  color: string;
};

const accountTypeOptions: AccountTypeOption[] = [
  { value: AccountType.PIX, label: 'PIX', color: '#10B981' },
  { value: AccountType.CREDIT_CARD, label: 'Cartão de Crédito', color: '#3B82F6' },
  { value: AccountType.DEBIT_CARD, label: 'Cartão de Débito', color: '#6366F1' },
  { value: AccountType.BANK, label: 'Banco', color: '#0EA5E9' },
  { value: AccountType.WALLET, label: 'Carteira', color: '#F59E0B' },
  { value: AccountType.INVESTMENT, label: 'Investimento', color: '#8B5CF6' },
  { value: AccountType.CRYPTO, label: 'Cripto', color: '#F43F5E' },
  { value: AccountType.OTHERS, label: 'Outros', color: '#6B7280' },
];

export function AccountsForm({ isOpen, onClose, account, onSuccess }: AccountsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useAccountForm({
    account,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<AccountFormValues>(() => {
    if (account) {
      return {
        name: account.name,
        type: account.type as AccountType,
        color: account.color || '#000000',
      };
    }
    return {
      name: '',
      type: AccountType.BANK,
      color: '#000000',
    };
  }, [account]);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar conta' : 'Nova conta'}
      description="Insira os detalhes da conta abaixo."
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
                  <Input placeholder="Ex: Nubank, Banco do Brasil, Sicoob..." {...field} />
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
                    {accountTypeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor para identificador visual</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="h-10 w-4/12 p-1" {...field} />
                    <span className="text-muted-foreground ml-2 font-mono text-xs uppercase">
                      {field.value}
                    </span>
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
