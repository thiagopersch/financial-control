'use client';

import { FormDialog } from '@/components/ui/form-dialog';
import {
  CreateDebtFormValues,
  createDebtSchema,
  EditDebtFormValues,
  editDebtSchema,
  useDebtForm,
} from '@/hooks/forms/use-debt-form';
import type { AccountDTO } from '@/lib/queries/accounts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DebtsFormFields } from './debts-form-fields';

interface DebtsFormProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: any | null;
  accounts?: AccountDTO[];
  onSuccess?: () => void;
}

const defaultValues = {
  create: {
    name: '',
    description: '',
    initialValue: '',
    interestRate: '',
    minimumPayment: '',
    dueDay: 1,
    installments: '',
    calculationType: 'TOTAL_DIVIDED',
    installmentValue: '',
    firstInstallmentMonth: 'NEXT',
    accountId: '',
  },
  edit: {
    name: '',
    description: '',
    interestRate: '',
    dueDay: 1,
    installments: '',
    calculationType: 'TOTAL_DIVIDED',
    installmentValue: '',
    firstInstallmentMonth: 'NEXT',
  },
};

export function DebtsForm({ isOpen, onClose, debt, accounts = [], onSuccess }: DebtsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const type: 'create' | 'edit' = debt ? 'edit' : 'create';

  const { handleCreate, handleUpdate } = useDebtForm({
    debt,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const schema = type === 'create' ? createDebtSchema : editDebtSchema;

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: debt
      ? {
          name: debt.name,
          description: debt.description || '',
          interestRate: debt.interestRate?.toString() || '',
          dueDay: debt.dueDay?.toString() || '',
          installments: debt.installments?.toString() || '',
          calculationType: debt.calculationType || 'TOTAL_DIVIDED',
          installmentValue: debt.installmentValue?.toString() || '',
          firstInstallmentMonth: debt.firstInstallmentMonth || 'NEXT',
        }
      : defaultValues.create,
  });

  useEffect(() => {
    if (isOpen) {
      if (debt) {
        form.reset({
          name: debt.name,
          description: debt.description || '',
          interestRate: debt.interestRate?.toString() || '',
          dueDay: debt.dueDay?.toString() || '',
          installments: debt.installments?.toString() || '',
          calculationType: debt.calculationType || 'TOTAL_DIVIDED',
          installmentValue: debt.installmentValue?.toString() || '',
          firstInstallmentMonth: debt.firstInstallmentMonth || 'NEXT',
        });
      } else {
        form.reset(defaultValues.create);
      }
    }
  }, [isOpen, debt, form]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (type === 'create') {
        const createValues: CreateDebtFormValues = {
          name: values.name,
          description: values.description || undefined,
          initialValue: parseFloat(values.initialValue) || 0,
          currentValue: parseFloat(values.initialValue) || 0,
          minimumPayment: parseFloat(values.minimumPayment) || 0,
          interestRate: values.interestRate ? parseFloat(values.interestRate) : null,
          dueDay: values.dueDay ? parseInt(values.dueDay) : null,
          installments: values.installments ? parseInt(values.installments) : null,
          calculationType: values.calculationType,
          installmentValue: values.installmentValue ? parseFloat(values.installmentValue) : null,
          firstInstallmentMonth: values.firstInstallmentMonth,
          accountId: values.accountId,
          startDate: new Date().toISOString(),
        };
        await handleCreate(createValues);
      } else {
        const editValues: EditDebtFormValues = {
          name: values.name,
          description: values.description || undefined,
          interestRate: values.interestRate || '',
          dueDay: values.dueDay || '',
          installments: values.installments || '',
          calculationType: values.calculationType,
          installmentValue: values.installmentValue || '',
          firstInstallmentMonth: values.firstInstallmentMonth,
        };
        await handleUpdate(editValues);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      title={type === 'create' ? 'Nova Dívida' : 'Editar Dívida'}
      description={
        type === 'create'
          ? 'Adicione uma nova dívida ou financiamento'
          : 'Atualize os dados da dívida'
      }
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText={type === 'create' ? 'Salvar' : 'Atualizar'}
      isSubmitting={isSubmitting}
    >
      <DebtsFormFields form={form} type={type} accounts={accounts} />
    </FormDialog>
  );
}
