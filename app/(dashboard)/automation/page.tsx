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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { deleteConditionalRule, toggleConditionalRule } from '@/lib/actions/conditional-rules';
import { useConditionalRules } from '@/lib/queries/automation';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { GitBranch, MoreHorizontal, Pencil, Play, Plus, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  automationSchema,
  useAutomationForm,
  type AutomationFormValues,
} from '@/hooks/forms/use-automation-form';
import type { ConditionalRule } from '@/lib/queries/automation';

const conditionOptions = [
  { value: 'AMOUNT_GREATER', label: 'Valor maior que' },
  { value: 'AMOUNT_LESS', label: 'Valor menor que' },
  { value: 'AMOUNT_EQUAL', label: 'Valor igual a' },
  { value: 'CATEGORY_IS', label: 'Categoria é' },
  { value: 'TAG_IS', label: 'Tag é' },
  { value: 'CONTAINS', label: 'Descrição contém' },
];

const actionOptions = [
  { value: 'ADD_TAG', label: 'Adicionar tag' },
  { value: 'ADD_CATEGORY', label: 'Mudar categoria' },
  { value: 'SET_STATUS', label: 'Alterar status' },
  { value: 'NOTIFY', label: 'Enviar notificação' },
];

export default function AutomationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ConditionalRule | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const { rules, isLoading, refresh } = useConditionalRules();

  const { handleSubmit: handleFormSubmit, isEditing } = useAutomationForm({
    rule: selectedRule,
    onSuccess: () => {
      setIsDialogOpen(false);
      setSelectedRule(null);
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

  useEffect(() => {
    if (isDialogOpen) {
      form.reset(defaultValues);
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

  const handleDelete = (id: string) => {
    setRuleToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (ruleToDelete) {
      try {
        const result = await deleteConditionalRule(ruleToDelete);
        if (result.success) {
          showSuccess('Regra excluída', 'A regra foi excluída com sucesso!');
          refresh();
        } else {
          showError('Erro ao excluir regra', result.error);
        }
      } catch {
        showError('Erro ao excluir regra');
      }
      setIsDeleteOpen(false);
      setRuleToDelete(null);
    }
  };

  const openCreate = () => {
    setSelectedRule(null);
    setIsDialogOpen(true);
  };

  const openEdit = (rule: ConditionalRule) => {
    setSelectedRule(rule);
    setIsDialogOpen(true);
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação</h1>
          <p className="text-muted-foreground">Crie regras condicionais para automatizar tarefas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Regra
        </Button>
      </div>

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
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma regra criada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Crie regras para automatizar suas transações
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
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

      <FormDialog
        title={isEditing ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
        description="Configure condições e ações para automatizar transações"
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedRule(null);
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra</FormLabel>
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
                    <FormLabel>Condição</FormLabel>
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
                    <FormLabel>Valor</FormLabel>
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
                    <FormLabel>Ação</FormLabel>
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
                    <FormLabel>Parâmetro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Alimentação" {...field} />
                    </FormControl>
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
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
