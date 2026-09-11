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
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { showWarning } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DebtInstallmentTab } from './debt-form-tabs-installment';
import { DebtInfoTab } from './debt-form-tabs-info';
import { DebtSummaryTab } from './debt-form-tabs-summary';

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

const TAB_FIELDS: Record<string, string[]> = {
  info: ['name', 'accountId', 'supplierId', 'categoryId', 'paymentMethodId'],
  installment: [
    'initialValue',
    'calculationType',
    'installments',
    'installmentValue',
    'firstInstallmentDate',
    'dueDay',
  ],
};

const TAB_ORDER = ['info', 'installment', 'summary'] as const;

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
  const [activeTab, setActiveTab] = useState('info');
  const [maxUnlockedTab, setMaxUnlockedTab] = useState(0);
  const [pendingValues, setPendingValues] = useState<any | null>(null);
  const type: 'create' | 'edit' = debt ? 'edit' : 'create';

  const { handleCreate, handleUpdate } = useDebtForm({
    debt,
    onSuccess: () => {
      router.push('/debts');
    },
  });

  const schema = type === 'create' ? createDebtSchema : editDebtSchema;

  const defaultValues = useMemo(() => {
    if (!debt) {
      return {
        name: '',
        description: '',
        initialValue: 0,
        currentValue: 0,
        status: 'ACTIVE',
        dueDay: 10,
        startDate: new Date().toISOString(),
        installments: '',
        accountId: '',
        categoryId: '',
        supplierId: '',
        paymentMethodId: '',
        creditCardId: null,
        calculationType: 'TOTAL_DIVIDED',
        installmentValue: null,
        firstInstallmentMonth: 'NEXT',
        periodicity: 'MONTHLY',
        firstInstallmentDate: '',
      };
    }
    return {
      name: debt.name,
      description: debt.description || '',
      status: debt.status,
      initialValue: debt.initialValue?.toString() || '',
      currentValue: debt.currentValue ?? 0,
      startDate: debt.startDate,
      dueDay: debt.dueDay?.toString() || '10',
      installments: debt.installments?.toString() || '',
      calculationType: debt.calculationType || 'TOTAL_DIVIDED',
      installmentValue: debt.installmentValue?.toString() || '',
      firstInstallmentMonth: debt.firstInstallmentMonth || 'NEXT',
      periodicity: debt.periodicity || 'MONTHLY',
      firstInstallmentDate: debt.firstInstallmentDate || '',
      accountId: debt.accountId || '',
      categoryId: debt.categoryId || '',
      supplierId: debt.supplierId || '',
      paymentMethodId: debt.paymentMethodId || '',
      creditCardId: debt.creditCardId,
    };
  }, [debt]);

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const findTabWithError = (errors: Record<string, any>): string | null => {
    const errorKeys = Object.keys(errors);
    for (const [tab, fields] of Object.entries(TAB_FIELDS)) {
      if (fields.some((f) => errorKeys.includes(f))) {
        return tab;
      }
    }
    return errorKeys.length > 0 ? 'info' : null;
  };

  const focusFirstError = (errors: Record<string, any>, tab: string) => {
    const fields = TAB_FIELDS[tab] || [];
    const firstErrorKey = fields.find((f) => errors[f]) || Object.keys(errors)[0];
    if (!firstErrorKey) return;

    const rawName = firstErrorKey.includes('.') ? firstErrorKey.split('.')[0] : firstErrorKey;
    const el = document.querySelector(`[name="${rawName}"]`);
    if (el instanceof HTMLElement) {
      el.focus();
    }
  };

  const submitCreate = async (values: any) => {
    try {
      await handleCreate(values as unknown as CreateDebtFormValues);
    } catch {
      // handled inside handleCreate
    }
  };

  const submitUpdate = async (values: any) => {
    try {
      await handleUpdate(values as unknown as EditDebtFormValues);
    } catch {
      // handled inside handleUpdate
    }
  };

  const affectsInstallments = (values: any) => {
    if (!debt) return false;
    return (
      values.installments !== (debt.installments?.toString() || '') ||
      values.calculationType !== (debt.calculationType || 'TOTAL_DIVIDED') ||
      values.installmentValue !== (debt.installmentValue?.toString() || '') ||
      values.firstInstallmentMonth !== (debt.firstInstallmentMonth || 'NEXT') ||
      values.periodicity !== (debt.periodicity || 'MONTHLY') ||
      values.firstInstallmentDate !== (debt.firstInstallmentDate || '') ||
      values.dueDay !== (debt.dueDay?.toString() || '10') ||
      values.accountId !== (debt.accountId || '') ||
      values.categoryId !== (debt.categoryId || '') ||
      values.paymentMethodId !== (debt.paymentMethodId || '') ||
      values.creditCardId !== debt.creditCardId ||
      parseFloat(values.initialValue) !== debt.initialValue
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

  const isTabLocked = (tab: (typeof TAB_ORDER)[number]) => {
    return type === 'create' && TAB_ORDER.indexOf(tab) > maxUnlockedTab;
  };

  const handleAdvanceTab = async () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab as (typeof TAB_ORDER)[number]);
    const fields = TAB_FIELDS[activeTab] || [];
    const isValid = await form.trigger(fields as any);
    if (!isValid) {
      showWarning(
        'Existem campos obrigatórios pendentes',
        'Preencha os campos destacados para continuar.',
      );
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextTab = TAB_ORDER[nextIndex];
    if (!nextTab) return;

    setMaxUnlockedTab((prev) => Math.max(prev, nextIndex));
    setActiveTab(nextTab);
  };

  const handleSubmitWithValidation = () => {
    void form.handleSubmit(onSubmit, (errors) => {
      const tabWithError = findTabWithError(errors ?? {});
      showWarning(
        'Existem campos obrigatórios pendentes',
        'Preencha os campos destacados para continuar.',
      );
      if (tabWithError) {
        setActiveTab(tabWithError);
        setTimeout(() => focusFirstError(errors ?? {}, tabWithError), 100);
      }
    })();
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
    <div className="mx-auto w-[90%] space-y-6">
      <Button type="button" variant="ghost" className="gap-2" onClick={() => router.push('/debts')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{type === 'create' ? 'Nova dívida' : 'Editar dívida'}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {type === 'create'
              ? 'Cadastre uma nova obrigação financeira.'
              : 'Atualize as informações da obrigação financeira.'}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="installment" disabled={isTabLocked('installment')}>
                    Parcelamento
                  </TabsTrigger>
                  <TabsTrigger value="summary" disabled={isTabLocked('summary')}>
                    Resumo
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  {activeTab === 'info' && (
                    <DebtInfoTab
                      form={form}
                      type={type}
                      accounts={accounts}
                      categories={categories}
                      suppliers={suppliers}
                      paymentMethods={paymentMethods}
                      creditCards={creditCards}
                    />
                  )}
                  {activeTab === 'installment' && <DebtInstallmentTab form={form} />}
                  {activeTab === 'summary' && (
                    <DebtSummaryTab
                      form={form}
                      debt={debt}
                      accounts={accounts}
                      categories={categories}
                      suppliers={suppliers}
                      paymentMethods={paymentMethods}
                    />
                  )}
                </div>
              </Tabs>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/debts')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                {activeTab === 'summary' ? (
                  <Button type="button" onClick={handleSubmitWithValidation} disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Salvando...'
                      : type === 'create'
                        ? 'Salvar dívida'
                        : 'Atualizar dívida'}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleAdvanceTab} disabled={isSubmitting}>
                    Avançar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingValues} onOpenChange={(open) => !open && setPendingValues(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar parcelas da dívida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta alteração afeta o parcelamento. As parcelas com status <strong>não paga</strong>{' '}
              serão atualizadas com os novos dados (categoria, conta, valores e datas); novas
              parcelas só são criadas se o número de parcelas aumentar. As parcelas já pagas não
              sofrerão nenhuma alteração. Deseja continuar?
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
