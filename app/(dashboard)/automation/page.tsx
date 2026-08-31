'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Input } from '@/components/ui/input';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { ListPagination } from '@/components/ui/list-pagination';
import { SelectSearch } from '@/components/ui/select-search';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteConditionalRule, toggleConditionalRule } from '@/lib/actions/conditional-rules';
import { useConditionalRules } from '@/lib/queries/automation';
import { useNotificationTemplates } from '@/lib/queries/notification-templates-client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { GitBranch, MoreHorizontal, Pencil, Play, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  automationSchema,
  useAutomationForm,
  type AutomationFormValues,
} from '@/hooks/forms/use-automation-form';
import { usePersistedPageFilters } from '@/hooks/use-persisted-page-filters';
import type { ConditionalRule } from '@/lib/queries/automation';

const conditionOptions = [
  { value: 'AMOUNT_GREATER', label: 'Valor maior que' },
  { value: 'AMOUNT_LESS', label: 'Valor menor que' },
  { value: 'AMOUNT_EQUAL', label: 'Valor igual a' },
  { value: 'CATEGORY_IS', label: 'Categoria é' },
  { value: 'CATEGORY_NOT', label: 'Categoria não é' },
  { value: 'TAG_IS', label: 'Tag é' },
  { value: 'TAG_NOT', label: 'Tag não é' },
  { value: 'CONTAINS', label: 'Descrição contém' },
];

const actionOptions = [
  { value: 'ADD_TAG', label: 'Adicionar tag' },
  { value: 'REMOVE_TAG', label: 'Remover tag' },
  { value: 'ADD_CATEGORY', label: 'Mudar categoria' },
  { value: 'ADD_COST_CENTER', label: 'Definir centro de custo' },
  { value: 'SET_ACCOUNT', label: 'Definir conta' },
  { value: 'SET_PAYMENT_METHOD', label: 'Definir meio de pagamento' },
  { value: 'SET_SUPPLIER', label: 'Definir fornecedor' },
  { value: 'SET_STATUS', label: 'Alterar status' },
  { value: 'NOTIFY', label: 'Enviar notificação' },
];

export default function AutomationPage() {
  const { rules, isLoading, refresh } = useConditionalRules();

  const {
    selected: selectedRule,
    isFormOpen: isDialogOpen,
    openCreate,
    openEdit,
    close: closeDialog,
  } = useCrudDialogState<ConditionalRule>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteConditionalRule, {
    successMessage: 'A regra foi excluída com sucesso!',
    errorMessage: 'Erro ao excluir regra',
    onSuccess: () => refresh(),
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  usePersistedPageFilters('automation', { search, statusFilter }, (saved) => {
    if (saved.search !== undefined) setSearch(saved.search);
    if (saved.statusFilter) setStatusFilter(saved.statusFilter as typeof statusFilter);
  });

  const { handleSubmit: handleFormSubmit, isEditing } = useAutomationForm({
    rule: selectedRule,
    onSuccess: () => {
      closeDialog();
      refresh();
    },
  });

  const defaultValues = useMemo<AutomationFormValues>(() => {
    if (selectedRule) {
      return {
        name: selectedRule.name,
        description: selectedRule.description || '',
        conditionType: Array.isArray(selectedRule.conditions)
          ? selectedRule.conditions[0]?.type || ''
          : '',
        conditionValue: Array.isArray(selectedRule.conditions)
          ? String(selectedRule.conditions[0]?.value || '')
          : '',
        actionType: Array.isArray(selectedRule.actions) ? selectedRule.actions[0]?.type || '' : '',
        actionValue: Array.isArray(selectedRule.actions)
          ? String(selectedRule.actions[0]?.value || '')
          : '',
      };
    }
    return {
      name: '',
      description: '',
      conditionType: '',
      conditionValue: '',
      actionType: '',
      actionValue: '',
    };
  }, [selectedRule]);

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues,
  });

  const { templates: notificationTemplates } = useNotificationTemplates();
  const activeNotificationTemplates = useMemo(
    () => notificationTemplates.filter((t) => t.isActive),
    [notificationTemplates],
  );
  const selectedActionType = form.watch('actionType');
  const selectedActionValue = form.watch('actionValue');
  const isNotifyAction = selectedActionType === 'NOTIFY';
  const isUsingTemplate = selectedActionValue?.startsWith('template:') ?? false;
  const [notifyMode, setNotifyMode] = useState<'custom' | 'template'>('custom');

  useEffect(() => {
    if (isDialogOpen) {
      form.reset(defaultValues);
      setNotifyMode(defaultValues.actionValue?.startsWith('template:') ? 'template' : 'custom');
    }
  }, [isDialogOpen, defaultValues, form]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: AutomationFormValues) => {
    setIsSubmitting(true);
    await handleFormSubmit(values);
    setIsSubmitting(false);
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const result = await toggleConditionalRule(id, !isActive);
      if (result.success) {
        showSuccess(isActive ? 'Regra desativada' : 'Regra ativada');
        refresh();
      } else {
        showError('Erro ao atualizar regra', result.error);
      }
    } catch {
      showError('Erro ao atualizar regra');
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rules.filter((rule) => {
      const matchesSearch =
        !term ||
        rule.name.toLowerCase().includes(term) ||
        (rule.description || '').toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && rule.isActive) ||
        (statusFilter === 'inactive' && !rule.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [rules, search, statusFilter]);

  const totalCount = filteredRules.length;
  const paginatedRules = filteredRules.slice((page - 1) * pageSize, page * pageSize);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <ListPageHeader
        title="Fluxo de Automação"
        description="Crie regras condicionais para automatizar tarefas"
        searchParams={searchParams}
        onSearch={handleSearch}
        showFilterToggle={false}
        inlineFilters={
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>
        }
        createLabel="Nova Regra"
        onCreate={openCreate}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <GitBranch className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <Play className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="bg-muted h-6 w-1/3 rounded" />
                <div className="bg-muted mt-2 h-4 w-2/3 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma regra encontrada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              {rules.length === 0
                ? 'Crie regras para automatizar suas transações'
                : 'Ajuste os filtros para encontrar regras'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedRules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Zap
                    className={`h-5 w-5 ${rule.isActive ? 'text-yellow-500' : 'text-gray-400'}`}
                  />
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id, rule.isActive)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(rule)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {rule.description || 'Sem descrição'}
                </p>
                {Array.isArray(rule.conditions) && rule.conditions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rule.conditions.map((cond: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {conditionOptions.find((o) => o.value === cond.type)?.label || cond.type}:{' '}
                        {String(cond.value)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredRules.length > 0 && (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      <FormDialog
        title={isEditing ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
        description="Configure condições e ações para automatizar transações"
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-4">
            <p className="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-xs">
              Toda vez que uma transação é criada ou editada, o sistema verifica se ela atende à
              condição definida abaixo; se atender, a ação configurada é executada automaticamente.
            </p>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nome da Regra</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Categorizar alimentação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <FormField
                control={form.control}
                name="conditionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="flex items-center gap-1">
                      Condição
                      <InfoTooltip text="O que a transação precisa ter para a regra disparar. Ex: 'Descrição contém' verifica se o nome/observação da transação contém o texto informado ao lado." />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conditionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="conditionValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="flex items-center gap-1">
                      Valor
                      <InfoTooltip text="O valor a comparar. Para condições de valor, use números (ex: 100.00). Para categoria/tag, digite o nome exatamente como cadastrado. Para 'contém', digite o texto a procurar." />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 100.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="flex items-center gap-1">
                      Ação
                      <InfoTooltip text="O que fazer com a transação quando a condição for atendida." />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {actionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="actionValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="flex items-center gap-1">
                      Parâmetro
                      <InfoTooltip text="O valor usado pela ação: nome da tag (Adicionar/Remover tag), nome da categoria (Mudar categoria), nome do centro de custo (Definir centro de custo), nome da conta (Definir conta), nome do meio de pagamento (Definir meio de pagamento), nome do fornecedor (Definir fornecedor), status PAID/PENDING/OVERDUE (Alterar status) ou o texto/template da notificação (Enviar notificação)." />
                    </FormLabel>
                    {isNotifyAction ? (
                      <div className="space-y-2">
                        <Select
                          value={notifyMode}
                          onValueChange={(v) => {
                            const mode = (v as 'custom' | 'template') || 'custom';
                            setNotifyMode(mode);
                            field.onChange('');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="custom">Mensagem personalizada</SelectItem>
                            <SelectItem value="template">Template de mensagem</SelectItem>
                          </SelectContent>
                        </Select>
                        {notifyMode === 'template' ? (
                          <SelectSearch
                            options={activeNotificationTemplates.map((t) => ({
                              value: `template:${t.id}`,
                              label: t.name,
                            }))}
                            value={isUsingTemplate ? field.value : null}
                            onValueChange={(v) => field.onChange(v || '')}
                            placeholder="Buscar template..."
                            emptyText="Nenhum template criado ainda"
                            disabled={activeNotificationTemplates.length === 0}
                          />
                        ) : (
                          <Input placeholder="Texto da notificação" {...field} />
                        )}
                      </div>
                    ) : (
                      <FormControl>
                        <Input placeholder="Ex: Alimentação" {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                      placeholder="Descrição da regra"
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

      <DeleteConfirmModal
        title="Excluir Regra de Automação"
        description="Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
