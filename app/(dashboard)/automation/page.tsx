'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  createConditionalRule,
  deleteConditionalRule,
  toggleConditionalRule,
} from '@/lib/actions/conditional-rules';
import { useConditionalRules } from '@/lib/queries/automation';
import { showError, showSuccess, showValidationErrors } from '@/lib/utils/toast';
import { GitBranch, MoreHorizontal, Play, Plus, Zap } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

const automationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  conditionType: z.string().min(1, 'Selecione uma condição'),
  conditionValue: z.string().min(1, 'Valor é obrigatório'),
  actionType: z.string().min(1, 'Selecione uma ação'),
  actionValue: z.string().min(1, 'Parâmetro é obrigatório'),
});

type AutomationFormValues = z.infer<typeof automationSchema>;

export default function AutomationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { rules, isLoading, refresh } = useConditionalRules();

  const form = useForm<AutomationFormValues>({
    defaultValues: {
      name: '',
      description: '',
      conditionType: '',
      conditionValue: '',
      actionType: '',
      actionValue: '',
    },
  });

  const onSubmit = async (data: AutomationFormValues) => {
    const result = automationSchema.safeParse(data);

    if (!result.success) {
      showValidationErrors(result.error);
      return;
    }

    try {
      const conditions = [
        {
          type: data.conditionType,
          value: data.conditionValue,
        },
      ];

      const actions = [
        {
          type: data.actionType,
          value: data.actionValue,
        },
      ];

      const actionResult = await createConditionalRule({
        name: data.name,
        description: data.description || undefined,
        conditions,
        actions,
        priority: 0,
        isActive: true,
      });

      if (actionResult.success) {
        showSuccess('Regra criada com sucesso');
        form.reset();
        setIsDialogOpen(false);
        refresh();
      } else {
        showError('Erro ao criar regra', actionResult.error);
      }
    } catch (error) {
      showError('Erro ao criar regra');
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const result = await toggleConditionalRule(id, !isActive);
      if (result.success) {
        showSuccess(isActive ? 'Regra desativada' : 'Regra ativada');
        refresh();
      }
    } catch (error) {
      showError('Erro ao atualizar regra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    try {
      const result = await deleteConditionalRule(id);
      if (result.success) {
        showSuccess('Regra excluída com sucesso');
        refresh();
      }
    } catch (error) {
      showError('Erro ao excluir regra');
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação</h1>
          <p className="text-muted-foreground">Crie regras condicionais para automatizar tarefas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra de Automação</DialogTitle>
              <DialogDescription>
                Configure condições e ações para automatizar transações
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  {...form.register('description')}
                  placeholder="Descrição da regra"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condição</Label>
                  <Select
                    value={form.watch('conditionType')}
                    onValueChange={(value) => form.setValue('conditionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.conditionType && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.conditionType.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditionValue">Valor</Label>
                  <Input
                    id="conditionValue"
                    {...form.register('conditionValue')}
                    placeholder="Valor da condição"
                  />
                  {form.formState.errors.conditionValue && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.conditionValue.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select
                    value={form.watch('actionType')}
                    onValueChange={(value) => form.setValue('actionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.actionType && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.actionType.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionValue">Parâmetro</Label>
                  <Input
                    id="actionValue"
                    {...form.register('actionValue')}
                    placeholder="Parâmetro da ação"
                  />
                  {form.formState.errors.actionValue && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.actionValue.message}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Criando...' : 'Criar Regra'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                <div className="bg-muted h-6 rounded" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
