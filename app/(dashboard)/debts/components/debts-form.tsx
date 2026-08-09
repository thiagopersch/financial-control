'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface Category {
  id: string;
  name: string;
  color: string;
}

interface DebtsFormProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: any | null;
  accounts?: AccountDTO[];
  categories?: Category[];
  onSuccess?: () => void;
}

const defaultValues = {
  create: {
    name: '',
    description: '',
    initialValue: '',
    currentValue: 0,
    dueDay: 10,
    installments: '',
    calculationType: 'TOTAL_DIVIDED',
    installmentValue: '',
    firstInstallmentMonth: 'NEXT',
    accountId: '',
    categoryId: '',
    startDate: new Date().toISOString(),
  },
  edit: {
    name: '',
    description: '',
    dueDay: '10',
    installments: '',
    calculationType: 'TOTAL_DIVIDED',
    installmentValue: '',
    firstInstallmentMonth: 'NEXT',
  },
};

export function DebtsForm({
  isOpen,
  onClose,
  debt,
  accounts = [],
  categories = [],
  onSuccess,
}: DebtsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<any | null>(null);
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
          dueDay: debt.dueDay?.toString() || '10',
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
          dueDay: debt.dueDay?.toString() || '10',
          installments: debt.installments?.toString() || '',
          calculationType: debt.calculationType || 'TOTAL_DIVIDED',
          installmentValue: debt.installmentValue?.toString() || '',
          firstInstallmentMonth: debt.firstInstallmentMonth || 'NEXT',
        });
      } else {
        form.reset(defaultValues.create);
        form.register('currentValue');
        form.register('startDate');
      }
    }
  }, [isOpen, debt, form]);

  const submitCreate = async (values: any) => {
    const createValues: CreateDebtFormValues = {
      name: values.name,
      description: values.description || undefined,
      initialValue: parseFloat(values.initialValue) || 0,
      currentValue: parseFloat(values.initialValue) || 0,
      dueDay: parseInt(values.dueDay) || 10,
      installments: parseInt(values.installments) || 1,
      calculationType: values.calculationType,
      installmentValue: values.installmentValue ? parseFloat(values.installmentValue) : null,
      firstInstallmentMonth: values.firstInstallmentMonth,
      accountId: values.accountId,
      categoryId: values.categoryId || null,
      startDate: new Date().toISOString(),
    };
    await handleCreate(createValues);
  };

  const submitUpdate = async (values: any) => {
    const editValues: EditDebtFormValues = {
      name: values.name,
      description: values.description || undefined,
      dueDay: values.dueDay || '',
      installments: values.installments || '',
      calculationType: values.calculationType,
      installmentValue: values.installmentValue || '',
      firstInstallmentMonth: values.firstInstallmentMonth,
    };
    await handleUpdate(editValues);
  };

  const affectsInstallments = (values: any) => {
    if (!debt) return false;
    return (
      values.installments !== (debt.installments?.toString() || '') ||
      values.calculationType !== (debt.calculationType || 'TOTAL_DIVIDED') ||
      values.installmentValue !== (debt.installmentValue?.toString() || '') ||
      values.firstInstallmentMonth !== (debt.firstInstallmentMonth || 'NEXT') ||
      values.dueDay !== (debt.dueDay?.toString() || '10')
    );
  };

  const onSubmit = async (values: any) => {
    if (type === 'edit' && affectsInstallments(values)) {
      setPendingValues(values);
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === 'create') {
        await submitCreate(values);
      } else {
        await submitUpdate(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmPendingUpdate = async () => {
    if (!pendingValues) return;
    setIsSubmitting(true);
    try {
      await submitUpdate(pendingValues);
    } finally {
      setIsSubmitting(false);
      setPendingValues(null);
    }
  };

  return (
    <>
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
        <DebtsFormFields form={form} type={type} accounts={accounts} categories={categories} />
      </FormDialog>

      <AlertDialog open={!!pendingValues} onOpenChange={(open) => !open && setPendingValues(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar parcelas da dívida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta alteração afeta o parcelamento. Apenas as parcelas com status{' '}
              <strong>não paga</strong> serão recalculadas e substituídas; as parcelas já pagas não
              sofrerão alteração. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingValues(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
