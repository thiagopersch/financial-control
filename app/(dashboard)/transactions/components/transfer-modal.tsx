'use client';

import { DatePicker } from '@/components/ui/date-picker';
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
import { createTransfer } from '@/lib/actions/transfers';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const transferSchema = z
  .object({
    amount: z.coerce.number().positive('Valor deve ser maior que zero'),
    date: z.coerce.date(),
    description: z.string().optional(),
    fromAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
    toAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'A conta de destino deve ser diferente da conta de origem',
    path: ['toAccountId'],
  });

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: { id: string; name: string; color?: string; balance?: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function TransferModal({ isOpen, onClose, accounts }: TransferModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema) as any,
    defaultValues: {
      amount: 0,
      date: new Date(),
      description: '',
      fromAccountId: '',
      toAccountId: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const fromAccountId = form.watch('fromAccountId');

  async function onSubmit(values: TransferFormValues) {
    setLoading(true);
    try {
      const result = await createTransfer(values);
      if (result.success) {
        showSuccess('Transferência realizada com sucesso');
        form.reset();
        onClose();
      } else {
        showError(result.error || 'Erro ao realizar transferência');
      }
    } catch {
      showError('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormDialog
      title="Nova Transferência"
      description="Transfira valores entre suas contas de forma rápida e segura."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText="Confirmar Transferência"
      isSubmitting={loading}
    >
      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Conta de origem</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (form.getValues('toAccountId') === v) {
                        form.setValue('toAccountId', '');
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a conta de origem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className="flex w-full items-center gap-2">
                            {acc.color && (
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: acc.color }}
                              />
                            )}
                            <span>{acc.name}</span>
                            {typeof acc.balance === 'number' && (
                              <span className="text-muted-foreground ml-auto text-xs">
                                {formatCurrency(acc.balance)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="-my-2 flex justify-center">
              <div className="bg-muted rounded-full p-1">
                <ArrowRightLeft className="text-muted-foreground h-4 w-4 rotate-90" />
              </div>
            </div>

            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Conta de destino</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a conta de destino" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter((acc) => acc.id !== fromAccountId)
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            <div className="flex w-full items-center gap-2">
                              {acc.color && (
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: acc.color }}
                                />
                              )}
                              <span>{acc.name}</span>
                              {typeof acc.balance === 'number' && (
                                <span className="text-muted-foreground ml-auto text-xs">
                                  {formatCurrency(acc.balance)}
                                </span>
                              )}
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

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => {
                const displayValue = field.value
                  ? Number(field.value).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '';
                return (
                  <FormItem>
                    <FormLabel required>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0,00"
                        value={displayValue}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          const numeric = digits ? parseInt(digits, 10) / 100 : 0;
                          field.onChange(numeric);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Data</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Input maxLength={255} placeholder="Ex: Ajuste de saldo, Reserva" {...field} />
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
