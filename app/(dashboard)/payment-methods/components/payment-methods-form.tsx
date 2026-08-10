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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  paymentMethodSchema,
  usePaymentMethodForm,
  type PaymentMethodFormValues,
} from '@/hooks/forms/use-payment-method-form';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface PaymentMethodsFormProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod?: PaymentMethodDTO | null;
  accounts: AccountDTO[];
  onSuccess?: () => void;
}

export function PaymentMethodsForm({
  isOpen,
  onClose,
  paymentMethod,
  accounts,
  onSuccess,
}: PaymentMethodsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = usePaymentMethodForm({
    paymentMethod,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<PaymentMethodFormValues>(() => {
    if (paymentMethod) {
      return {
        name: paymentMethod.name,
        color: paymentMethod.color || '#6366f1',
        isCreditCard: paymentMethod.isCreditCard,
        accountIds: paymentMethod.accountIds,
      };
    }
    return {
      name: '',
      color: '#6366f1',
      isCreditCard: false,
      accountIds: [],
    };
  }, [paymentMethod]);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (values: PaymentMethodFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar meio de pagamento' : 'Novo meio de pagamento'}
      description="Insira os detalhes do meio de pagamento abaixo."
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
                  <Input placeholder="Ex: PIX, Cartão de crédito, Boleto..." {...field} />
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
                <FormLabel>Cor para identificador visual</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="h-10 w-6/12 cursor-pointer p-1" {...field} />
                    <span className="text-muted-foreground ml-2 font-mono text-xs uppercase">
                      {field.value}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isCreditCard"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />É cartão de
                    crédito?
                  </label>
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Quando marcado, ao escolher este meio de pagamento em uma transação será
                  necessário selecionar também um cartão de crédito da conta.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <FormField
            control={form.control}
            name="accountIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contas vinculadas</FormLabel>
                <FormControl>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                    {accounts.length === 0 && (
                      <p className="text-muted-foreground text-sm">Nenhuma conta cadastrada.</p>
                    )}
                    {accounts.map((account) => {
                      const checked = field.value.includes(account.id);
                      return (
                        <label
                          key={account.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              if (value) {
                                field.onChange([...field.value, account.id]);
                              } else {
                                field.onChange(field.value.filter((id) => id !== account.id));
                              }
                            }}
                          />
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: account.color || '#000000' }}
                          />
                          {account.name}
                        </label>
                      );
                    })}
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
