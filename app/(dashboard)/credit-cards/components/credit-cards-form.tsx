'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  useCreditCardForm,
  type CreditCardFormValues,
  creditCardSchema,
} from '@/hooks/forms/use-credit-card-form';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import type { AccountDTO } from '@/lib/queries/accounts';

interface CreditCardsFormProps {
  isOpen: boolean;
  onClose: () => void;
  creditCard?: CreditCardDTO | null;
  accounts: AccountDTO[];
  onSuccess?: () => void;
}

export function CreditCardsForm({
  isOpen,
  onClose,
  creditCard,
  accounts,
  onSuccess,
}: CreditCardsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useCreditCardForm({
    creditCard,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<CreditCardFormValues>(() => {
    if (creditCard) {
      return {
        limit: creditCard.limit,
        initialBalance: creditCard.initialBalance,
        closingDay: creditCard.closingDay,
        dueDay: creditCard.dueDay,
        accountId: creditCard.accountId,
        color: creditCard.color || '#6366f1',
      };
    }
    return {
      limit: 0,
      initialBalance: 0,
      closingDay: 0,
      dueDay: 0,
      accountId: '',
      color: '#6366f1',
    };
  }, [creditCard]);

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultValues]);

  const onSubmit = async (values: CreditCardFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
      description="Vincule uma conta para criar o cartão de crédito."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
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
                    {accounts
                      .filter((acc) => acc.type === 'BANK' || acc.type === 'CREDIT_CARD')
                      .map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
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
            name="limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
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
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="15"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="25"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="h-10 w-16 p-1" {...field} />
                    <span className="text-muted-foreground text-sm">{field.value}</span>
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
