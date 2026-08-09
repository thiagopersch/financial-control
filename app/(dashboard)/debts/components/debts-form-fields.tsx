'use client';

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
import { SelectSearch } from '@/components/ui/select-search';
import { Textarea } from '@/components/ui/textarea';
import type { AccountDTO } from '@/lib/queries/accounts';
import { UseFormReturn } from 'react-hook-form';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface DebtsFormFieldsProps {
  form: UseFormReturn<any>;
  type: 'create' | 'edit';
  accounts: AccountDTO[];
  categories?: Category[];
  suppliers?: Supplier[];
}

export function DebtsFormFields({
  form,
  type,
  accounts,
  categories = [],
  suppliers = [],
}: DebtsFormFieldsProps) {
  const isFixedInstallment = form.watch('calculationType') === 'FIXED_INSTALLMENT';

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Empréstimo do banco" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {type === 'create' && (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Conta para Pagamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: account.color || '#000000' }}
                            />
                            {account.name}
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
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Fornecedor</FormLabel>
                  <FormControl>
                    <SelectSearch
                      options={suppliers.map((sup) => ({ value: sup.id, label: sup.name }))}
                      value={field.value || null}
                      onValueChange={(v) => field.onChange(v)}
                      placeholder="Selecione um fornecedor"
                      emptyText="Nenhum fornecedor encontrado."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      emptyText="Nenhuma categoria de despesa encontrada."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        {type === 'create' && (
          <FormField
            control={form.control}
            name="initialValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Valor Total</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <FormField
            control={form.control}
            name="calculationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Tipo de Cálculo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TOTAL_DIVIDED">Dividir total automaticamente</SelectItem>
                    <SelectItem value="FIXED_INSTALLMENT">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {isFixedInstallment && (
            <FormField
              control={form.control}
              name="installmentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Valor da Parcela</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Número de Parcelas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex: 12"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firstInstallmentMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Primeira Parcela</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CURRENT">Este Mês</SelectItem>
                    <SelectItem value="NEXT">Próximo Mês</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="dueDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Dia de Vencimento no Mês</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  placeholder="Ex: 10"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={255}
                  rows={3}
                  placeholder="Descrição da dívida..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
