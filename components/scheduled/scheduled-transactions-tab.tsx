'use client';

import { useState } from 'react';
import { CalendarClock, CreditCard, FileText, Play, Pause } from 'lucide-react';
import { ScheduledCard } from '@/components/scheduled/scheduled-card';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { FormDialog } from '@/components/ui/form-dialog';
import { FormTabContent, FormTabsList, type FormTabDefinition } from '@/components/ui/form-tabs';
import { Tabs } from '@/components/ui/tabs';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoTooltip } from '@/components/ui/info-tooltip';
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
import { CreditCardSelect } from '@/components/transactions/credit-card-select';
import { SelectSearch } from '@/components/ui/select-search';
import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { ListPagination } from '@/components/ui/list-pagination';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { usePersistedPageFilters } from '@/hooks/use-persisted-page-filters';
import { hasPermission } from '@/lib/permissions/has-permission';
import { matchesMulti, parseMultiParam, serializeMultiParam } from '@/lib/utils/filter-params';
import {
  findFirstTabWithError,
  focusFirstInvalidField,
  getInvalidFieldLabels,
  getTabsWithErrors,
  type TabFieldMap,
} from '@/lib/utils/form-tabs';
import { showError, showSuccess, showWarning } from '@/lib/utils/toast';
import { useSession } from 'next-auth/react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import {
  useScheduledTransactions,
  useCategories,
  type ScheduledTransaction,
} from '@/lib/queries/scheduled';
import { useAccounts } from '@/lib/queries/accounts-client';
import { usePaymentMethods } from '@/lib/queries/payment-methods-client';
import { useCreditCards } from '@/lib/queries/credit-cards-client';
import { useSuppliers } from '@/lib/queries/suppliers-client';
import { useCostCenters } from '@/lib/queries/cost-centers-client';
import {
  createScheduledTransaction,
  deleteScheduledTransaction,
  runScheduledTransactionNow,
  toggleScheduledTransaction,
  updateScheduledTransaction,
} from '@/lib/actions/scheduled';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';

const scheduledSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().refine((value) => Number(value) > 0, 'Valor deve ser maior que zero'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'BUSINESS_DAYS']),
  dayOfMonth: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 31,
      'Dia do mês deve ser entre 1 e 31',
    ),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
});

/** Base UI's Select can emit `null` through onValueChange when the controlled value
 * doesn't match any item (e.g. right after form.reset() sets a field back to ''). */
function coerceSelectChange(onChange: (value: string) => void) {
  return (value: string | null) => onChange(value ?? '');
}

type ScheduledFormData = z.infer<typeof scheduledSchema>;

/** Cartão é obrigatório quando o meio de pagamento escolhido é de cartão de crédito. */
function buildScheduledSchema(creditCardMethodIds: Set<string>) {
  return scheduledSchema.superRefine((data, ctx) => {
    if (creditCardMethodIds.has(data.paymentMethodId) && !data.creditCardId) {
      ctx.addIssue({
        code: 'custom',
        path: ['creditCardId'],
        message: 'Cartão é obrigatório para este meio de pagamento',
      });
    }
  });
}

type ScheduledTab = 'identification' | 'schedule' | 'payment';

const SCHEDULED_TABS: readonly FormTabDefinition<ScheduledTab>[] = [
  { value: 'identification', label: 'Identificação', icon: <FileText /> },
  { value: 'schedule', label: 'Agendamento', icon: <CalendarClock /> },
  { value: 'payment', label: 'Pagamento', icon: <CreditCard /> },
];

const SCHEDULED_TAB_ORDER = SCHEDULED_TABS.map((tab) => tab.value);

const SCHEDULED_TAB_FIELDS: TabFieldMap<ScheduledTab> = {
  identification: ['name', 'type', 'amount', 'categoryId', 'supplierId'],
  schedule: ['frequency', 'dayOfMonth'],
  payment: ['accountId', 'paymentMethodId', 'creditCardId'],
};

const SCHEDULED_FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  type: 'Tipo',
  amount: 'Valor',
  categoryId: 'Categoria',
  supplierId: 'Fornecedor',
  frequency: 'Frequência',
  dayOfMonth: 'Dia do mês',
  accountId: 'Conta',
  paymentMethodId: 'Meio de pagamento',
  creditCardId: 'Cartão',
};

const TYPE_FILTER_OPTIONS: MultiSelectOption[] = [
  { value: 'INCOME', label: 'Receita', color: '#10b981' },
  { value: 'EXPENSE', label: 'Despesa', color: '#f43f5e' },
  { value: 'TRANSFER', label: 'Transferência', color: '#3b82f6' },
];

const FREQUENCY_FILTER_OPTIONS: MultiSelectOption[] = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'YEARLY', label: 'Anual' },
  { value: 'BUSINESS_DAYS', label: 'Dias úteis' },
  { value: 'CUSTOM', label: 'Personalizada' },
];

const STATUS_FILTER_OPTIONS: MultiSelectOption[] = [
  { value: 'active', label: 'Ativo', color: '#10b981' },
  { value: 'inactive', label: 'Inativo', color: '#94a3b8' },
];

export function ScheduledTransactionsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ScheduledTab>('identification');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [frequencyFilter, setFrequencyFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [runningItem, setRunningItem] = useState<ScheduledTransaction | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: session } = useSession();
  const canUpdate = hasPermission(session?.user?.permissions, 'scheduled', 'UPDATE');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  usePersistedPageFilters(
    'scheduled',
    {
      search,
      typeFilter: serializeMultiParam(typeFilter),
      frequencyFilter: serializeMultiParam(frequencyFilter),
      statusFilter: serializeMultiParam(statusFilter),
      categoryFilter: serializeMultiParam(categoryFilter),
    },
    (saved) => {
      if (saved.search !== undefined) setSearch(saved.search);
      setTypeFilter(parseMultiParam(saved.typeFilter));
      setFrequencyFilter(parseMultiParam(saved.frequencyFilter));
      setStatusFilter(parseMultiParam(saved.statusFilter));
      setCategoryFilter(parseMultiParam(saved.categoryFilter));
    },
  );

  const { transactions, isLoading, refresh } = useScheduledTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { paymentMethods } = usePaymentMethods();
  const { creditCards } = useCreditCards();
  const { suppliers } = useSuppliers();
  const { costCenters } = useCostCenters();

  // O agendamento guarda só os IDs de conta/meio/cartão/centro de custo: resolve os nomes aqui.
  const namesById = useMemo(
    () => ({
      accounts: new Map(accounts.map((a) => [a.id, a.name])),
      paymentMethods: new Map(paymentMethods.map((pm) => [pm.id, pm.name])),
      creditCards: new Map(
        creditCards.map((card) => [card.id, `${card.account.name} · venc. dia ${card.dueDay}`]),
      ),
      costCenters: new Map(costCenters.map((cc) => [cc.id, cc.name])),
    }),
    [accounts, paymentMethods, creditCards, costCenters],
  );

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteScheduledTransaction, {
    successMessage: 'Agendamento excluído com sucesso',
    errorMessage: 'Erro ao excluir agendamento',
    onSuccess: () => refresh(),
  });

  // Meios de pagamento chegam via SWR depois do mount: o resolver lê a lista atual por ref.
  const creditCardMethodIdsRef = useRef<Set<string>>(new Set());
  creditCardMethodIdsRef.current = new Set(
    paymentMethods.filter((pm) => pm.isCreditCard).map((pm) => pm.id),
  );

  const form = useForm<ScheduledFormData>({
    resolver: (values, context, options) =>
      zodResolver(buildScheduledSchema(creditCardMethodIdsRef.current))(values, context, options),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      amount: '',
      frequency: 'MONTHLY',
      dayOfMonth: '1',
      categoryId: '',
      accountId: '',
      paymentMethodId: '',
      creditCardId: null,
      supplierId: '',
    },
  });

  const selectedType = form.watch('type');
  const selectedAccountId = form.watch('accountId');
  const selectedPaymentMethodId = form.watch('paymentMethodId');

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === selectedType),
    [categories, selectedType],
  );

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

  const selectedCategoryId = form.watch('categoryId');
  useEffect(() => {
    if (selectedCategoryId && !filteredCategories.some((c) => c.id === selectedCategoryId)) {
      form.setValue('categoryId', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setActiveTab('identification');
    setEditingId(null);
    form.reset();
  };

  const openCreate = () => {
    setEditingId(null);
    setActiveTab('identification');
    form.reset();
    setIsDialogOpen(true);
  };

  const openEdit = (item: ScheduledTransaction) => {
    setEditingId(item.id);
    setActiveTab('identification');
    form.reset({
      name: item.name,
      type: item.type as 'INCOME' | 'EXPENSE',
      amount: String(item.amount),
      frequency: item.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BUSINESS_DAYS',
      dayOfMonth: String(item.dayOfMonth ?? 1),
      categoryId: item.categoryId,
      accountId: item.accountId ?? '',
      paymentMethodId: item.paymentMethodId ?? '',
      creditCardId: item.creditCardId ?? null,
      supplierId: item.supplierId ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ScheduledFormData) => {
    try {
      const payload = {
        name: data.name,
        type: data.type as 'INCOME' | 'EXPENSE',
        amount: parseFloat(data.amount),
        frequency: data.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BUSINESS_DAYS',
        dayOfMonth: parseInt(data.dayOfMonth),
        categoryId: data.categoryId,
        accountId: data.accountId,
        paymentMethodId: data.paymentMethodId,
        creditCardId: data.creditCardId,
        supplierId: data.supplierId,
      };

      if (editingId) {
        const result = await updateScheduledTransaction(editingId, payload);
        if (result.success) {
          showSuccess('Agendamento atualizado com sucesso!');
          closeDialog();
          refresh();
        } else {
          showError(
            'Erro ao atualizar agendamento',
            result.error || 'Não foi possível atualizar o agendamento.',
          );
        }
        return;
      }

      const nextRun = new Date();
      if (data.frequency === 'MONTHLY') {
        nextRun.setDate(parseInt(data.dayOfMonth));
        if (nextRun < new Date()) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }

      const result = await createScheduledTransaction({
        ...payload,
        nextRun: nextRun.toISOString(),
      });

      if (result.success) {
        showSuccess(
          'Agendamento criado com sucesso!',
          'A transação será gerada automaticamente quando a data de execução for atingida.',
        );
        closeDialog();
        refresh();
      } else {
        showError(
          'Erro ao criar agendamento',
          result.error || 'Não foi possível criar o agendamento.',
        );
      }
    } catch (error) {
      showError('Erro ao criar agendamento', 'Ocorreu um erro inesperado ao criar o agendamento.');
    }
  };

  const errorTabs = getTabsWithErrors(form.formState.errors, SCHEDULED_TAB_FIELDS);

  /** Lista os campos pendentes e leva o usuário à aba do primeiro deles. */
  const onInvalid = (errors: FieldErrors<ScheduledFormData>) => {
    const labels = getInvalidFieldLabels(
      errors,
      SCHEDULED_TAB_FIELDS,
      SCHEDULED_TAB_ORDER,
      SCHEDULED_FIELD_LABELS,
    );
    showWarning('Preencha os campos obrigatórios', labels.join(', '));
    const tab = findFirstTabWithError(errors, SCHEDULED_TAB_FIELDS, SCHEDULED_TAB_ORDER);
    if (tab) setActiveTab(tab);
    focusFirstInvalidField(document.querySelector<HTMLElement>('[role="dialog"]'));
  };

  const onSubmit = form.handleSubmit(async (data) => {
    await handleSubmit(data);
  }, onInvalid);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleScheduledTransaction(id, !currentStatus);
      if (result.success) {
        showSuccess(currentStatus ? 'Agendamento pausado' : 'Agendamento ativado');
        refresh();
      }
    } catch (error) {
      showError('Erro ao atualizar agendamento');
    }
  };

  const confirmRunNow = async () => {
    if (!runningItem) return;
    setIsRunning(true);
    try {
      const result = await runScheduledTransactionNow(runningItem.id);
      if (result.success) {
        showSuccess('Agendamento executado!', result.message);
        refresh();
      } else {
        showError('Agendamento não executado', result.error);
      }
    } catch {
      showError('Erro ao executar agendamento');
    } finally {
      setIsRunning(false);
      setRunningItem(null);
    }
  };

  const activeCount = transactions.filter((s) => s.isActive).length;

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = matchesMulti(typeFilter, item.type);
      const matchesFrequency = matchesMulti(frequencyFilter, item.frequency);
      const matchesStatus = matchesMulti(statusFilter, item.isActive ? 'active' : 'inactive');
      const matchesCategory = matchesMulti(categoryFilter, item.categoryId);

      return matchesSearch && matchesType && matchesFrequency && matchesStatus && matchesCategory;
    });
  }, [transactions, search, typeFilter, frequencyFilter, statusFilter, categoryFilter]);

  const totalCount = filteredTransactions.length;
  const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const hasActiveFilters =
    typeFilter.length > 0 ||
    frequencyFilter.length > 0 ||
    statusFilter.length > 0 ||
    categoryFilter.length > 0;

  const handleClearFilters = () => {
    setTypeFilter([]);
    setFrequencyFilter([]);
    setStatusFilter([]);
    setCategoryFilter([]);
    setPage(1);
  };

  const onFilterChange = (setter: (value: string[]) => void) => (value: string[]) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <ListPageHeader
        searchParams={searchParams}
        onSearch={handleSearch}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        createLabel="Novo Agendamento"
        onCreate={openCreate}
        paginationSlotRef={setPaginationSlot}
        filtersPanel={
          <FilterPanel onApply={() => setPage(1)} onClear={handleClearFilters}>
            <FilterField label="Tipo">
              <MultiSelect
                options={TYPE_FILTER_OPTIONS}
                value={typeFilter}
                onValueChange={onFilterChange(setTypeFilter)}
                placeholder="Todos os tipos"
              />
            </FilterField>
            <FilterField label="Frequência">
              <MultiSelect
                options={FREQUENCY_FILTER_OPTIONS}
                value={frequencyFilter}
                onValueChange={onFilterChange(setFrequencyFilter)}
                placeholder="Todas as frequências"
              />
            </FilterField>
            <FilterField label="Status">
              <MultiSelect
                options={STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onValueChange={onFilterChange(setStatusFilter)}
                placeholder="Todos os status"
              />
            </FilterField>
            <FilterField label="Categoria">
              <MultiSelect
                options={categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                  color: cat.color || '#666',
                }))}
                value={categoryFilter}
                onValueChange={onFilterChange(setCategoryFilter)}
                placeholder="Todas as categorias"
              />
            </FilterField>
          </FilterPanel>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
            <CalendarClock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Pause className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-9 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Skeleton key={j} className="h-8" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarClock className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum agendamento</h3>
            <p className="text-muted-foreground mt-2 text-center">
              {transactions.length === 0
                ? 'Crie agendamentos para transações recorrentes'
                : 'Nenhum agendamento corresponde aos filtros aplicados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedTransactions.map((item, index) => (
            <ScheduledCard
              key={item.id}
              item={item}
              index={index}
              accountName={item.accountId ? namesById.accounts.get(item.accountId) : null}
              paymentMethodName={
                item.paymentMethodId ? namesById.paymentMethods.get(item.paymentMethodId) : null
              }
              creditCardName={
                item.creditCardId ? namesById.creditCards.get(item.creditCardId) : null
              }
              costCenterName={
                item.costCenterId ? namesById.costCenters.get(item.costCenterId) : null
              }
              canUpdate={canUpdate}
              isRunning={isRunning && runningItem?.id === item.id}
              onToggleActive={() => toggleActive(item.id, item.isActive)}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item.id)}
              onRunNow={() => setRunningItem(item)}
            />
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          paginationSlot={paginationSlot}
        />
      )}

      <FormDialog
        title={editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
        description="Configure uma transação recorrente ou agendada"
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSubmit={onSubmit}
        confirmText={editingId ? 'Salvar' : 'Agendar'}
        cancelText="Cancelar"
        isSubmitting={form.formState.isSubmitting}
      >
        <Form {...form}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScheduledTab)}>
            <FormTabsList tabs={SCHEDULED_TABS} errorTabs={errorTabs} />

            <FormTabContent value="identification">
              <p className="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-xs">
                Uma transação pendente é gerada automaticamente sempre que a data de execução for
                atingida, seguindo a frequência escolhida.
              </p>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aluguel, Salário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Tipo</FormLabel>
                      <Select
                        onValueChange={coerceSelectChange(field.onChange)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INCOME">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              Receita
                            </div>
                          </SelectItem>
                          <SelectItem value="EXPENSE">
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
                        <FormLabel required>Valor</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={displayValue}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const numeric = digits ? parseInt(digits, 10) / 100 : 0;
                              field.onChange(String(numeric));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
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
                              style={{ backgroundColor: cat.color || '#666' }}
                            />
                          ),
                        }))}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? '')}
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
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Fornecedor</FormLabel>
                    <FormControl>
                      <SelectSearch
                        options={suppliers.map((sup) => ({ value: sup.id, label: sup.name }))}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? '')}
                        placeholder="Selecione um fornecedor"
                        emptyText="Nenhum fornecedor encontrado."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormTabContent>

            <FormTabContent value="schedule">
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="flex items-center gap-1">
                        Frequência
                        <InfoTooltip text="Com que intervalo a transação deve ser gerada: diariamente, semanalmente, mensalmente (usa o 'Dia do mês' abaixo) ou apenas em dias úteis." />
                      </FormLabel>
                      <Select
                        onValueChange={coerceSelectChange(field.onChange)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">Diário</SelectItem>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                          <SelectItem value="MONTHLY">Mensal</SelectItem>
                          <SelectItem value="BUSINESS_DAYS">Dias úteis</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="flex items-center gap-1">
                        Dia do mês
                        <InfoTooltip text="Usado apenas quando a frequência é 'Mensal': dia (1 a 31) em que a transação será gerada todo mês." />
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormTabContent>

            <FormTabContent value="payment">
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Conta</FormLabel>
                    <FormControl>
                      <SelectSearch
                        options={accounts.map((acc) => ({
                          value: acc.id,
                          label: acc.name,
                          icon: (
                            <div
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: acc.color || '#94a3b8' }}
                            />
                          ),
                        }))}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? '')}
                        placeholder="Selecione a conta"
                        emptyText="Nenhuma conta encontrada."
                      />
                    </FormControl>
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
                          field.onChange(v ?? '');
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
            </FormTabContent>
          </Tabs>
        </Form>
      </FormDialog>

      <AlertDialog
        open={!!runningItem}
        onOpenChange={(open) => {
          if (!open && !isRunning) setRunningItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Executar agendamento agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Uma transação pendente de &quot;{runningItem?.name}&quot; será gerada para a próxima
              ocorrência
              {runningItem
                ? ` (${new Date(runningItem.nextRun).toLocaleDateString('pt-BR')})`
                : ''}{' '}
              e a próxima execução será avançada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRunning}>Cancelar</AlertDialogCancel>
            <Button onClick={confirmRunNow} disabled={isRunning}>
              <Play className="h-4 w-4" />
              {isRunning ? 'Executando...' : 'Executar agora'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmModal
        title="Excluir Agendamento"
        description="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
