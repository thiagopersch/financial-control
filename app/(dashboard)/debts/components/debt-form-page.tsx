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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreateDebtFormValues,
  createDebtSchema,
  EditDebtFormValues,
  editDebtSchema,
  useDebtForm,
} from '@/hooks/forms/use-debt-form';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import type { DebtDTO } from '@/lib/queries/debts';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { DebtsFormFields } from './debts-form-fields';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface DebtFormPageProps {
  debt?: DebtDTO | null;
  accounts: AccountDTO[];
  categories: Category[];
  suppliers: Supplier[];
  paymentMethods: PaymentMethodDTO[];
  creditCards: CreditCardDTO[];
}

const defaultValuesCreate = {
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
  supplierId: '',
  paymentMethodId: '',
  creditCardId: null,
  startDate: new Date().toISOString(),
};

export function DebtFormPage({
  debt,
  accounts = [],
  categories = [],
  suppliers = [],
  paymentMethods = [],
  creditCards = [],
}: DebtFormPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<any | null>(null);
  const type: 'create' | 'edit' = debt ? 'edit' : 'create';

  const { handleCreate, handleUpdate } = useDebtForm({
    debt,
    onSuccess: () => {
      router.push('/debts');
    },
  });

  const schema = type === 'create' ? createDebtSchema : editDebtSchema;

  const form = useForm<any>({
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
          accountId: debt.accountId || '',
          categoryId: debt.categoryId || '',
          supplierId: debt.supplierId || '',
          paymentMethodId: debt.paymentMethodId || '',
          creditCardId: debt.creditCardId,
        }
      : defaultValuesCreate,
  });

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
      categoryId: values.categoryId,
      supplierId: values.supplierId,
      paymentMethodId: values.paymentMethodId,
      creditCardId: values.creditCardId,
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
      accountId: values.accountId,
      categoryId: values.categoryId,
      supplierId: values.supplierId,
      paymentMethodId: values.paymentMethodId,
      creditCardId: values.creditCardId,
      initialValue: values.initialValue,
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
      values.dueDay !== (debt.dueDay?.toString() || '10') ||
      values.accountId !== (debt.accountId || '') ||
      values.categoryId !== (debt.categoryId || '') ||
      values.paymentMethodId !== (debt.paymentMethodId || '') ||
      values.creditCardId !== debt.creditCardId
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
    <div className="mx-auto max-w-3xl space-y-6">
      <Button type="button" variant="ghost" className="gap-2" onClick={() => router.push('/debts')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{type === 'create' ? 'Nova Dívida' : 'Editar Dívida'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <DebtsFormFields
              form={form}
              type={type}
              accounts={accounts}
              categories={categories}
              suppliers={suppliers}
              paymentMethods={paymentMethods}
              creditCards={creditCards}
            />
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/debts')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : type === 'create' ? 'Salvar' : 'Atualizar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
    </div>
  );
}
