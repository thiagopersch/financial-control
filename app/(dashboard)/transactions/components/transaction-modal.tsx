'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createTransaction, updateTransaction } from '@/lib/actions/transactions';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { parse } from 'date-fns';
import { Loader2, Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const transactionSchema = z.object({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum([TransactionStatus.PAID, TransactionStatus.PENDING, TransactionStatus.OVERDUE]),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  costCenterId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(['CONTINUOUS', 'INSTALLMENTS']).nullable().optional(),
  installments: z.coerce.number().min(1, 'Deve ser no mínimo 1 parcela').nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; type: string; color: string }[];
  suppliers: { id: string; name: string }[];
  accounts: { id: string; name: string; color: string }[];
  costCenters?: { id: string; name: string }[];
  initialData?: any;
}

export function TransactionModal({
  isOpen,
  onClose,
  categories,
  suppliers,
  accounts,
  costCenters = [],
  initialData,
}: TransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: TransactionType.EXPENSE,
      amount: 0,
      date: new Date(),
      status: TransactionStatus.PENDING,
      categoryId: '',
      accountId: '',
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

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      return;
    }

    const parseDate = (d: any) => {
      if (!d) return null;
      if (typeof d === 'string') {
        return parse(d.split('T')[0], 'yyyy-MM-dd', new Date());
      }
      return new Date(d);
    };

    if (initialData) {
      form.reset({
        type: initialData.type,
        amount: Number(initialData.amount),
        date: parseDate(initialData.date) || new Date(),
        dueDate: parseDate(initialData.dueDate),
        status: initialData.status,
        categoryId: initialData.categoryId,
        accountId: initialData.accountId || '',
        costCenterId: initialData.costCenterId || null,
        supplierId: initialData.supplierId,
        notes: initialData.notes || '',
        isRecurring: initialData.isRecurring || false,
        recurrenceType: initialData.recurrenceType || 'CONTINUOUS',
        installments: initialData.installments || 1,
      });
    } else {
      form.reset({
        type: TransactionType.EXPENSE,
        amount: 0,
        date: new Date(),
        status: TransactionStatus.PENDING,
        categoryId: '',
        accountId: '',
        costCenterId: null,
        supplierId: null,
        notes: '',
        isRecurring: false,
        recurrenceType: 'CONTINUOUS',
        installments: 1,
      });
    }
  }, [isOpen, initialData, form]);

  const selectedType = form.watch('type');
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true);
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
        onClose();
        form.reset();
      } else {
        showError(
          result.error || initialData ? 'Erro ao atualizar transação.' : 'Erro ao criar transação.',
        );
      }
    } catch {
      showError('Erro inesperado.', 'Erro ao criar ou atualizar transação.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          <DialogDescription>Insira os detalhes da receita ou despesa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full min-w-0 space-y-4 pt-4">
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
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
                <FieldError errors={[form.formState.errors.status]} />
              </Field>
            )}
          />

          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="type">Tipo</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
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
                <FieldError errors={[form.formState.errors.type]} />
              </Field>
            )}
          />

          <Controller
            name="accountId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="accountId">Conta</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger id="accountId">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: acc.color }}
                          />
                          {acc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.accountId]} />
              </Field>
            )}
          />

          <Controller
            name="categoryId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.categoryId]} />
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="amount">Valor (R$)</FieldLabel>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...form.register('amount')}
            />
            <FieldError errors={[form.formState.errors.amount]} />
          </Field>
          <Controller
            name="date"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="date">Data</FieldLabel>
                <DatePicker date={field.value} setDate={field.onChange} />
                <FieldError errors={[form.formState.errors.date]} />
              </Field>
            )}
          />

          <Controller
            name="costCenterId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="costCenterId">Centro de Custo (opcional)</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                  <SelectTrigger id="costCenterId">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.costCenterId]} />
              </Field>
            )}
          />

          <Controller
            name="supplierId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="supplierId">Fornecedor (opcional)</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                  <SelectTrigger id="supplierId">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.supplierId]} />
              </Field>
            )}
          />

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="isRecurring"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="isRecurring"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isRecurring" className="flex cursor-pointer items-center gap-2">
                <Repeat className="text-muted-foreground h-4 w-4" />
                Recorrente?
              </Label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Controller
                  name="recurrenceType"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="recurrenceType">Frequência</FieldLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger id="recurrenceType">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONTINUOUS">Contínua (12m)</SelectItem>
                          <SelectItem value="INSTALLMENTS">Parcelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[form.formState.errors.recurrenceType]} />
                    </Field>
                  )}
                />

                {recurrenceType === 'INSTALLMENTS' && (
                  <Field>
                    <FieldLabel htmlFor="installments">Parcelas</FieldLabel>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      placeholder="Ex: 3"
                      {...form.register('installments')}
                    />
                    <FieldError errors={[form.formState.errors.installments]} />
                  </Field>
                )}
              </div>
            )}
          </div>

          <Field>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <Textarea
              id="notes"
              rows={4}
              maxLength={100}
              placeholder="Detalhes da transação..."
              {...form.register('notes')}
            />
            <FieldError errors={[form.formState.errors.notes]} />
          </Field>

          <div className="flex justify-end gap-2 pt-4 max-md:flex-col-reverse">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
