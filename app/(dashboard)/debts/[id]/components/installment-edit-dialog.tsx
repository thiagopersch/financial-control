'use client';

import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FormDialog } from '@/components/ui/form-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectSearch } from '@/components/ui/select-search';
import { CreditCardSelect } from '@/components/transactions/credit-card-select';
import { updateInstallment } from '@/lib/actions/debts';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import type { DebtDTO } from '@/lib/queries/debts';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import type { DebtTransactionDTO } from '@/lib/queries/transactions';
import { formatCurrency } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionStatus } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface InstallmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: DebtTransactionDTO | null;
  debt: DebtDTO | null;
  accounts: AccountDTO[];
  categories: Category[];
  paymentMethods: PaymentMethodDTO[];
  creditCards: CreditCardDTO[];
  onSaved?: () => void;
}

const installmentEditSchema = z.object({
  dueDate: z.coerce.date({ message: 'Data de vencimento inválida' }),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
});

type InstallmentEditValues = z.infer<typeof installmentEditSchema>;

function parseInstallmentNumber(description: string | null): string | null {
  if (!description) return null;
  const match = description.match(/Parcela\s+(\d+)\/(\d+)/i);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

export function InstallmentEditDialog({
  open,
  onOpenChange,
  transaction,
  debt,
  accounts,
  categories,
  paymentMethods,
  creditCards,
  onSaved,
}: InstallmentEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPaid = transaction?.status === TransactionStatus.PAID;

  const form = useForm<InstallmentEditValues>({
    resolver: zodResolver(installmentEditSchema) as any,
    defaultValues: {
      dueDate: new Date(),
      amount: 0,
      categoryId: '',
      accountId: '',
      paymentMethodId: '',
      creditCardId: null,
    },
  });

  useEffect(() => {
    if (open && transaction) {
      form.reset({
        dueDate: transaction.dueDate ? parseISO(transaction.dueDate) : parseISO(transaction.date),
        amount: transaction.amount,
        categoryId: transaction.categoryId || '',
        accountId: transaction.accountId || '',
        paymentMethodId: transaction.paymentMethodId || '',
        creditCardId: transaction.creditCardId || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  const selectedAccountId = form.watch('accountId');
  const selectedPaymentMethodId = form.watch('paymentMethodId');

  const accountPaymentMethods = useMemo(
    () => paymentMethods.filter((pm) => pm.accountIds.includes(selectedAccountId)),
    [paymentMethods, selectedAccountId],
  );

  const selectedPaymentMethod = useMemo(
    () => accountPaymentMethods.find((pm) => pm.id === selectedPaymentMethodId),
    [accountPaymentMethods, selectedPaymentMethodId],
  );

  const accountCreditCards = useMemo(
    () => creditCards.filter((card) => card.accountId === selectedAccountId),
    [creditCards, selectedAccountId],
  );

  useEffect(() => {
    if (
      selectedPaymentMethodId &&
      !accountPaymentMethods.some((pm) => pm.id === selectedPaymentMethodId)
    ) {
      form.setValue('paymentMethodId', '');
      form.setValue('creditCardId', null);
    }
  }, [selectedAccountId, accountPaymentMethods, selectedPaymentMethodId, form]);

  const installmentLabel = parseInstallmentNumber(transaction?.description || null);

  async function onSubmit(data: InstallmentEditValues) {
    if (!transaction) return;

    if (selectedPaymentMethod?.isCreditCard && !data.creditCardId) {
      form.setError('creditCardId', {
        message: 'Cartão é obrigatório para este meio de pagamento',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateInstallment(transaction.id, {
        dueDate: data.dueDate,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: data.accountId || null,
        paymentMethodId: data.paymentMethodId || null,
        creditCardId: data.creditCardId || null,
      });

      if (result.success) {
        showSuccess('Parcela atualizada', 'A parcela foi atualizada com sucesso');
        onOpenChange(false);
        onSaved?.();
      } else {
        showError(
          'Erro ao atualizar parcela',
          result.error || 'Não foi possível atualizar a parcela',
        );
      }
    } catch {
      showError('Erro inesperado', 'Não foi possível atualizar a parcela.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const previousAmount = transaction?.amount ?? 0;
  const previousDueDate = transaction?.dueDate
    ? format(parseISO(transaction.dueDate), 'dd/MM/yyyy', { locale: ptBR })
    : '-';

  return (
    <FormDialog
      title={
        isPaid
          ? `Parcela ${installmentLabel || ''}`.trim()
          : `Editar parcela ${installmentLabel || ''}`.trim()
      }
      description="Edite os dados da parcela. As alterações são refletidas automaticamente na transação vinculada e no progresso da dívida."
      isOpen={open}
      onClose={() => !isSubmitting && onOpenChange(false)}
      onSubmit={isPaid ? undefined : form.handleSubmit(onSubmit)}
      confirmText="Atualizar parcela"
      isSubmitting={isSubmitting}
    >
      <div className="rounded-lg border p-4 text-sm">
        <div className="text-muted-foreground mb-2 text-xs font-semibold uppercase">Resumo</div>
        {debt?.name && <p className="mb-2 text-sm font-medium">{debt.name}</p>}
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Valor atual</span>
          <span className="text-right font-medium">{formatCurrency(previousAmount)}</span>
          <span className="text-muted-foreground">Vencimento atual</span>
          <span className="text-right font-medium">{previousDueDate}</span>
          <span className="text-muted-foreground">Status</span>
          <span className="text-right font-medium">
            {isPaid
              ? 'Pago'
              : transaction?.status === TransactionStatus.OVERDUE
                ? 'Atrasado'
                : 'Pendente'}
          </span>
          <span className="text-muted-foreground">Categoria</span>
          <span className="text-muted-foreground text-right">
            {transaction?.categoryName || '-'}
          </span>
        </div>
      </div>

      {isPaid ? (
        <p className="text-muted-foreground text-sm">
          Parcelas pagas não podem ser editadas para preservar o histórico financeiro.
        </p>
      ) : (
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Vencimento</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} placeholder="Data" />
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
                  <FormLabel required>Conta para Pagamento</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('paymentMethodId', '');
                      form.setValue('creditCardId', null);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: acc.color || '#94a3b8' }}
                            />
                            {acc.name}
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
              name="paymentMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Meio de pagamento</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('creditCardId', null);
                    }}
                    value={field.value}
                    disabled={!selectedAccountId}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            selectedAccountId
                              ? 'Selecione o meio de pagamento'
                              : 'Selecione a conta primeiro'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountPaymentMethods.length === 0 && (
                        <div className="text-muted-foreground px-2 py-1.5 text-sm">
                          Nenhum meio de pagamento vinculado a esta conta.
                        </div>
                      )}
                      {accountPaymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: pm.color || '#6366f1' }}
                            />
                            {pm.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedPaymentMethod?.isCreditCard && (
              <FormField
                control={form.control}
                name="creditCardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Cartão</FormLabel>
                    <CreditCardSelect
                      cards={accountCreditCards}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Categoria</FormLabel>
                  <FormControl>
                    <SelectSearch
                      options={categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                        icon: (
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        ),
                      }))}
                      value={field.value || null}
                      onValueChange={(v) => field.onChange(v)}
                      placeholder="Selecione uma categoria"
                      emptyText="Nenhuma categoria encontrada."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      )}
    </FormDialog>
  );
}
