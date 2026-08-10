'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectSearch } from '@/components/ui/select-search';
import { Textarea } from '@/components/ui/textarea';
import { CreditCardSelect } from '@/components/transactions/credit-card-select';
import { createTransaction, updateTransaction } from '@/lib/actions/transactions';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { ArrowLeft, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const transactionSchema = z.object({
  description: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date({ error: 'Data de vencimento inválida' }),
  status: z.enum([TransactionStatus.PAID, TransactionStatus.PENDING, TransactionStatus.OVERDUE]),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  notes: z.string().max(255, 'Máximo de 255 caracteres').optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(['CONTINUOUS', 'INSTALLMENTS']).nullable().optional(),
  installments: z.coerce.number().min(1, 'Deve ser no mínimo 1 parcela').nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormPageProps {
  categories: { id: string; name: string; type: string; color: string }[];
  suppliers: { id: string; name: string }[];
  accounts: { id: string; name: string; color: string | null }[];
  costCenters?: { id: string; name: string }[];
  paymentMethods: PaymentMethodDTO[];
  creditCards: CreditCardDTO[];
  initialData?: any;
}

function parseDate(d: any): Date | null {
  if (!d) return null;
  const parsed = d instanceof Date ? d : new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function TransactionFormPage({
  categories,
  suppliers,
  accounts,
  costCenters = [],
  paymentMethods,
  creditCards,
  initialData,
}: TransactionFormPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: initialData
      ? {
          description: initialData.description || '',
          type: initialData.type,
          amount: Number(initialData.amount),
          date: parseDate(initialData.date) || new Date(),
          status: initialData.status,
          categoryId: initialData.categoryId,
          accountId: initialData.accountId || '',
          paymentMethodId: initialData.paymentMethodId || '',
          creditCardId: initialData.creditCardId || null,
          costCenterId: initialData.costCenterId || null,
          supplierId: initialData.supplierId,
          notes: initialData.notes || '',
          isRecurring: initialData.isRecurring || false,
          recurrenceType: initialData.recurrenceType || 'CONTINUOUS',
          installments: initialData.installments || 1,
        }
      : {
          description: '',
          type: TransactionType.EXPENSE,
          amount: 0,
          date: undefined as unknown as Date,
          status: TransactionStatus.PENDING,
          categoryId: '',
          accountId: '',
          paymentMethodId: '',
          creditCardId: null,
          costCenterId: null,
          supplierId: null,
          notes: '',
          isRecurring: false,
          recurrenceType: 'CONTINUOUS',
          installments: 1,
        },
  });

  const isRecurring = form.watch('isRecurring');
  const recurrenceType = form.watch('recurrenceType');
  const selectedType = form.watch('type');
  const selectedAccountId = form.watch('accountId');
  const selectedPaymentMethodId = form.watch('paymentMethodId');

  useEffect(() => {
    if (selectedType === TransactionType.INCOME) {
      form.setValue('status', TransactionStatus.PAID);
    }
  }, [selectedType, form]);

  useEffect(() => {
    if (!initialData && !form.getValues('date')) {
      form.setValue('date', new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCategories = categories.filter((c) => c.type === selectedType);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  async function onSubmit(data: TransactionFormValues) {
    if (selectedPaymentMethod?.isCreditCard && !data.creditCardId) {
      form.setError('creditCardId', {
        message: 'Cartão é obrigatório para este meio de pagamento',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (initialData) {
        result = await updateTransaction(initialData.id, data);
      } else {
        result = await createTransaction(data);
      }

      if (result.success) {
        showSuccess(
          initialData ? 'Transação atualizada!' : 'Transação criada!',
          initialData ? 'A transação foi atualizada.' : 'A transação foi criada.',
        );
        router.push('/transactions');
      } else {
        showError(
          result.error ||
            (initialData ? 'Erro ao atualizar transação.' : 'Erro ao criar transação.'),
        );
      }
    } catch {
      showError('Erro inesperado.', 'Erro ao criar ou atualizar transação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button
        type="button"
        variant="ghost"
        className="gap-2"
        onClick={() => router.push('/transactions')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Editar Transação' : 'Nova Transação'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome</FormLabel>
                    <FormControl>
                      <Input maxLength={100} placeholder="Ex: Supermercado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div
                className={
                  selectedType === TransactionType.INCOME
                    ? 'grid grid-cols-1 gap-4'
                    : 'grid grid-cols-2 gap-4 max-md:grid-cols-1'
                }
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransactionType.INCOME}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              Receita
                            </div>
                          </SelectItem>
                          <SelectItem value={TransactionType.EXPENSE}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-rose-500" />
                              Despesa
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedType !== TransactionType.INCOME && (
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
                            <SelectItem value={TransactionStatus.PAID}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Pago
                              </div>
                            </SelectItem>
                            <SelectItem value={TransactionStatus.PENDING}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                Pendente
                              </div>
                            </SelectItem>
                            <SelectItem value={TransactionStatus.OVERDUE}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-rose-500" />
                                Atrasado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Conta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a conta" />
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
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Meio de Pagamento</FormLabel>
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
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Categoria</FormLabel>
                      <FormControl>
                        <SelectSearch
                          options={filteredCategories.map((cat) => ({
                            value: cat.id,
                            label: cat.name,
                            icon: (
                              <div
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                            ),
                          }))}
                          value={field.value}
                          onValueChange={(v) => field.onChange(v || '')}
                          placeholder="Selecione a categoria"
                          emptyText="Nenhuma categoria encontrada."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Data de vencimento</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={field.onChange} />
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
              </div>
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor (opcional)</FormLabel>
                    <FormControl>
                      <SelectSearch
                        options={suppliers.map((sup) => ({ value: sup.id, label: sup.name }))}
                        value={field.value || null}
                        onValueChange={(v) => field.onChange(v)}
                        placeholder="Selecione..."
                        emptyText="Nenhum fornecedor encontrado."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <>
                        <FormControl>
                          <Checkbox
                            id="isRecurring"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label
                          htmlFor="isRecurring"
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Repeat className="text-muted-foreground h-4 w-4" />
                          Recorrente?
                        </Label>
                      </>
                    )}
                  />
                </div>
                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 pt-2 max-md:grid-cols-1">
                    <FormField
                      control={form.control}
                      name="recurrenceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CONTINUOUS">Contínua (12m)</SelectItem>
                              <SelectItem value="INSTALLMENTS">Parcelada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {recurrenceType === 'INSTALLMENTS' && (
                      <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parcelas</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 3"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        maxLength={255}
                        placeholder="Detalhes da transação..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/transactions')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
