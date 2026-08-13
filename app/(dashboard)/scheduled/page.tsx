'use client';

import { useState } from 'react';
import { CalendarClock, MoreHorizontal, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormDialog } from '@/components/ui/form-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCardSelect } from '@/components/transactions/credit-card-select';
import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { ListPagination } from '@/components/ui/list-pagination';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
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
import {
  createScheduledTransaction,
  deleteScheduledTransaction,
  toggleScheduledTransaction,
  updateScheduledTransaction,
} from '@/lib/actions/scheduled';

const scheduledSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'BUSINESS_DAYS']),
  dayOfMonth: z.string().min(1, 'Dia do mês é obrigatório'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
});

/** Base UI's Select can emit `null` through onValueChange when the controlled value
 * doesn't match any item (e.g. right after form.reset() sets a field back to ''). */
function coerceSelectChange(onChange: (value: string) => void) {
  return (value: string | null) => onChange(value ?? '');
}

type ScheduledFormData = z.infer<typeof scheduledSchema>;

export default function ScheduledPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<
    'all' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'BUSINESS_DAYS' | 'CUSTOM'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const { transactions, isLoading, refresh } = useScheduledTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { paymentMethods } = usePaymentMethods();
  const { creditCards } = useCreditCards();
  const { suppliers } = useSuppliers();

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

  const form = useForm<ScheduledFormData>({
    resolver: zodResolver(scheduledSchema),
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
      supplierId: null,
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
    setEditingId(null);
    form.reset();
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const openEdit = (item: ScheduledTransaction) => {
    setEditingId(item.id);
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
      supplierId: item.supplierId ?? null,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ScheduledFormData) => {
    if (selectedPaymentMethod?.isCreditCard && !data.creditCardId) {
      form.setError('creditCardId', {
        message: 'Cartão é obrigatório para este meio de pagamento',
      });
      return;
    }

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

  const onSubmit = form.handleSubmit(async (data) => {
    await handleSubmit(data);
  });

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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const frequencyLabels: Record<string, string> = {
    DAILY: 'Diária',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensal',
    YEARLY: 'Anual',
    BUSINESS_DAYS: 'Dias úteis',
    CUSTOM: 'Personalizado',
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
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesFrequency = frequencyFilter === 'all' || item.frequency === frequencyFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive);
      const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;

      return matchesSearch && matchesType && matchesFrequency && matchesStatus && matchesCategory;
    });
  }, [transactions, search, typeFilter, frequencyFilter, statusFilter, categoryFilter]);

  const totalCount = filteredTransactions.length;
  const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const hasActiveFilters =
    typeFilter !== 'all' ||
    frequencyFilter !== 'all' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all';

  const handleClearFilters = () => {
    setTypeFilter('all');
    setFrequencyFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <ListPageHeader
        title="Agendamentos"
        description="Gerencie transações recorrentes e agendadas"
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
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v as typeof typeFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="INCOME">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#10b981' }}
                      />
                      Receita
                    </div>
                  </SelectItem>
                  <SelectItem value="EXPENSE">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#f43f5e' }}
                      />
                      Despesa
                    </div>
                  </SelectItem>
                  <SelectItem value="TRANSFER">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#3b82f6' }}
                      />
                      Transferência
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Frequência">
              <Select
                value={frequencyFilter}
                onValueChange={(v) => {
                  setFrequencyFilter(v as typeof frequencyFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as frequências</SelectItem>
                  <SelectItem value="DAILY">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Diária
                    </div>
                  </SelectItem>
                  <SelectItem value="WEEKLY">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Semanal
                    </div>
                  </SelectItem>
                  <SelectItem value="MONTHLY">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Mensal
                    </div>
                  </SelectItem>
                  <SelectItem value="YEARLY">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Anual
                    </div>
                  </SelectItem>
                  <SelectItem value="BUSINESS_DAYS">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Dias úteis
                    </div>
                  </SelectItem>
                  <SelectItem value="CUSTOM">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Personalizado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Status">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as typeof statusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#10b981' }}
                      />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: '#94a3b8' }}
                      />
                      Inativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Categoria">
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color || '#666' }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="bg-muted h-6 rounded" />
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
        <div className="space-y-4">
          {paginatedTransactions.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CalendarClock
                    className={`h-5 w-5 ${item.isActive ? 'text-blue-500' : 'text-gray-400'}`}
                  />
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={() => toggleActive(item.id, item.isActive)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(item)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <span
                    className="font-medium"
                    style={item.type === 'INCOME' ? { color: 'green' } : { color: 'red' }}
                  >
                    {item.type === 'INCOME' ? '+' : '-'} {formatCurrency(item.amount)}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    {frequencyLabels[item.frequency] || item.frequency}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    Próxima: {new Date(item.nextRun).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
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
          <div className="space-y-4">
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
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={coerceSelectChange(field.onChange)} value={field.value}>
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
                      <FormLabel>Valor</FormLabel>
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
                    <Select onValueChange={coerceSelectChange(field.onChange)} value={field.value}>
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
                    <FormLabel className="flex items-center gap-1">
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
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={coerceSelectChange(field.onChange)} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color || '#666' }}
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
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Conta</FormLabel>
                  <Select onValueChange={coerceSelectChange(field.onChange)} value={field.value}>
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
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                    value={field.value ?? 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um fornecedor" />
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
          </div>
        </Form>
      </FormDialog>

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
