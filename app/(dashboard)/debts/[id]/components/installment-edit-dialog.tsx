'use client';

import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FormDialog } from '@/components/ui/form-dialog';
import { MonthPicker } from '@/components/ui/month-picker';
import { Textarea } from '@/components/ui/textarea';
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
import type { CostCenterDTO } from '@/lib/queries/cost-centers';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import type { DebtDTO } from '@/lib/queries/debts';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import type { DebtTransactionDTO } from '@/lib/queries/transactions';
import type { WorkspaceUserOption } from '@/lib/queries/users';
import { formatCurrency } from '@/lib/utils';
import {
  competenceToYearMonthString,
  formatCompetence,
  isSameCompetence,
  isYearMonthString,
  toYearMonthString,
} from '@/lib/utils/competence';
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
  costCenters: CostCenterDTO[];
  users: WorkspaceUserOption[];
  onSaved?: () => void;
}

const STATUS_OPTIONS: { value: TransactionStatus; label: string; dotClassName: string }[] = [
  { value: TransactionStatus.PAID, label: 'Pago', dotClassName: 'bg-emerald-500' },
  { value: TransactionStatus.PENDING, label: 'Pendente', dotClassName: 'bg-amber-500' },
  { value: TransactionStatus.OVERDUE, label: 'Atrasado', dotClassName: 'bg-rose-500' },
];

/** Mesmos campos/regras da edição de transação (ver transaction-form-page.tsx). */
const installmentEditSchema = z.object({
  date: z.coerce.date({ message: 'Data de vencimento inválida' }),
  competence: z
    .string({ message: 'Competência é obrigatória' })
    .refine(isYearMonthString, 'Competência é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  status: z.enum([TransactionStatus.PAID, TransactionStatus.PENDING, TransactionStatus.OVERDUE]),
  paidAt: z.coerce.date().nullable().optional(),
  paidById: z.string().nullable().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
  notes: z.string().max(255, 'Máximo de 255 caracteres').optional(),
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
  costCenters,
  users,
  onSaved,
}: InstallmentEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InstallmentEditValues>({
    resolver: zodResolver(installmentEditSchema) as any,
    defaultValues: {
      date: new Date(),
      competence: toYearMonthString(new Date()),
      amount: 0,
      status: TransactionStatus.PENDING,
      paidAt: null,
      paidById: null,
      categoryId: '',
      accountId: '',
      paymentMethodId: '',
      creditCardId: null,
      costCenterId: null,
      notes: '',
    },
  });

  useEffect(() => {
    if (open && transaction) {
      const dueDate = parseISO(transaction.dueDate ?? transaction.date);
      form.reset({
        date: dueDate,
        competence: competenceToYearMonthString(transaction.competence),
        amount: transaction.amount,
        status: transaction.status,
        paidAt: transaction.paidAt ? parseISO(transaction.paidAt) : null,
        paidById: transaction.paidById,
        categoryId: transaction.categoryId || '',
        accountId: transaction.accountId || '',
        paymentMethodId: transaction.paymentMethodId || '',
        creditCardId: transaction.creditCardId || null,
        costCenterId: transaction.costCenterId,
        notes: transaction.notes || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  const selectedAccountId = form.watch('accountId');
  const selectedPaymentMethodId = form.watch('paymentMethodId');
  const selectedStatus = form.watch('status');

  useEffect(() => {
    if (!open) return;
    if (selectedStatus === TransactionStatus.PAID && !form.getValues('paidAt')) {
      form.setValue('paidAt', new Date());
    } else if (selectedStatus !== TransactionStatus.PAID) {
      form.setValue('paidAt', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, open]);

  const movedFromCompetence =
    transaction && !isSameCompetence(transaction.competence, transaction.originalCompetence)
      ? formatCompetence(transaction.originalCompetence)
      : null;

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
        ...data,
        paidById: data.paidById || null,
        creditCardId: data.creditCardId || null,
        costCenterId: data.costCenterId || null,
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
      title={`Editar parcela ${installmentLabel || ''}`.trim()}
      description="Edite os dados da parcela. As alterações são refletidas automaticamente na transação vinculada e no progresso da dívida."
      isOpen={open}
      onClose={() => !isSubmitting && onOpenChange(false)}
      onSubmit={form.handleSubmit(onSubmit)}
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
            {STATUS_OPTIONS.find((option) => option.value === transaction?.status)?.label ?? '-'}
          </span>
          <span className="text-muted-foreground">Competência atual</span>
          <span className="text-right font-medium">
            {transaction ? formatCompetence(transaction.competence) : '-'}
          </span>
          <span className="text-muted-foreground">Categoria</span>
          <span className="text-muted-foreground text-right">
            {transaction?.categoryName || '-'}
          </span>
        </div>
      </div>

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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${option.dotClassName}`} />
                            {option.label}
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Data de vencimento</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} placeholder="Data" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="competence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Competência</FormLabel>
                  <FormControl>
                    <MonthPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  {movedFromCompetence && (
                    <p className="text-muted-foreground text-xs">
                      Competência de origem: {movedFromCompetence}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {selectedStatus === TransactionStatus.PAID && (
              <FormField
                control={form.control}
                name="paidAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de pagamento</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value || undefined}
                        setDate={(date) => field.onChange(date || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="paidById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pago por (opcional)</FormLabel>
                  <FormControl>
                    <SelectSearch
                      options={users.map((user) => ({
                        value: user.id,
                        label: user.isActive
                          ? user.name || user.email
                          : `${user.name || user.email} (inativo)`,
                      }))}
                      value={field.value || null}
                      onValueChange={(v) => field.onChange(v)}
                      placeholder="Selecione o usuário..."
                      emptyText="Nenhum usuário encontrado."
                    />
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
          <FormField
            control={form.control}
            name="costCenterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo (opcional)</FormLabel>
                <FormControl>
                  <SelectSearch
                    options={costCenters.map((cc) => ({ value: cc.id, label: cc.name }))}
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v)}
                    placeholder="Selecione..."
                    emptyText="Nenhum centro de custo encontrado."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    maxLength={255}
                    placeholder="Detalhes da parcela..."
                    {...field}
                  />
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
