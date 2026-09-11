'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PERIODICITY_OPTIONS } from '@/lib/constants/periodicity';
import { parseISO } from 'date-fns';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface DebtInstallmentTabProps {
  form: UseFormReturn<any>;
}

export function DebtInstallmentTab({ form }: DebtInstallmentTabProps) {
  const isFixedInstallment = form.watch('calculationType') === 'FIXED_INSTALLMENT';
  const installmentsValue = form.watch('installments');
  const initialValue = form.watch('initialValue');
  const installmentValue = form.watch('installmentValue');
  const calculationType = form.watch('calculationType');

  const installmentsCount =
    typeof installmentsValue === 'string'
      ? parseInt(installmentsValue, 10) || 0
      : installmentsValue || 0;

  useEffect(() => {
    if (
      isFixedInstallment &&
      installmentsCount > 0 &&
      installmentValue > 0 &&
      typeof initialValue === 'number' &&
      initialValue === 0
    ) {
      // When FIXED_INSTALLMENT is selected with zero total, derive total from parcels.
      const derived = Math.round(installmentsCount * installmentValue * 100) / 100;
      if (derived > 0) {
        form.setValue('initialValue', derived);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFixedInstallment, installmentsCount, installmentValue, calculationType]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="initialValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Valor Total</FormLabel>
            <FormControl>
              <CurrencyInput value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <FormField
          control={form.control}
          name="calculationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Tipo de Cálculo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
        <FormField
          control={form.control}
          name="installments"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Número de Parcelas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  step="1"
                  placeholder="Ex: 12"
                  {...field}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    const parsed = parseInt(cleaned, 10);
                    if (cleaned !== '' && !Number.isNaN(parsed)) {
                      const clamped = Math.min(Math.max(parsed, 1), 120);
                      field.onChange(String(clamped));
                    } else {
                      field.onChange('');
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {isFixedInstallment && (
        <FormField
          control={form.control}
          name="installmentValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Valor da Parcela</FormLabel>
              <FormControl>
                <CurrencyInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <FormField
          control={form.control}
          name="firstInstallmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Primeira Parcela</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value ? parseISO(field.value) : undefined}
                  setDate={(date) => field.onChange(date ? date.toISOString() : '')}
                  placeholder="Selecione a data"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="periodicity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repetição</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a periodicidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PERIODICITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
        name="dueDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Dia de Vencimento no Mês</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                step="1"
                placeholder="Ex: 10"
                {...field}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  const parsed = parseInt(cleaned, 10);
                  if (cleaned !== '' && !Number.isNaN(parsed)) {
                    const clamped = Math.min(Math.max(parsed, 1), 31);
                    field.onChange(String(clamped));
                  } else {
                    field.onChange('');
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="text-muted-foreground border-t pt-2 text-xs">
        {isFixedInstallment && installmentsCount > 0 && installmentValue > 0 ? (
          <span>
            O valor total será calculado como {installmentsCount} ×{' '}
            {Number(installmentValue).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            .
          </span>
        ) : (
          <span>
            Informe o valor total e a quantidade de parcelas. O sistema divide automaticamente e
            aplica eventuais diferenças de centavos na última parcela.
          </span>
        )}
      </div>
    </div>
  );
}
