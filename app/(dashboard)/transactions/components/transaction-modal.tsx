'use client';

import { Checkbox } from '@/components/ui/checkbox';
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
import { Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onClose();
        form.reset();
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
    <FormDialog
      title={initialData ? 'Editar Transação' : 'Nova Transação'}
      description="Insira os detalhes da receita ou despesa."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText={initialData ? 'Atualizar' : 'Cadastrar'}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
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
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
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
          </div>
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta</FormLabel>
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
                            style={{ backgroundColor: acc.color }}
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
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
                  <FormLabel>Data</FormLabel>
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
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {costCenters.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <Label htmlFor="isRecurring" className="flex cursor-pointer items-center gap-2">
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
                    maxLength={100}
                    placeholder="Detalhes da transação..."
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
