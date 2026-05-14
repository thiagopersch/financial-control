'use client';

import { useState } from 'react';
import { CalendarClock, Plus, MoreHorizontal, Play, Pause } from 'lucide-react';
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
import { showError, showSuccess } from '@/lib/utils/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useScheduledTransactions,
  useCategories,
  type ScheduledTransaction,
} from '@/lib/queries/scheduled';
import {
  createScheduledTransaction,
  deleteScheduledTransaction,
  toggleScheduledTransaction,
} from '@/lib/actions/scheduled';

const scheduledSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'BUSINESS_DAYS']),
  dayOfMonth: z.string().min(1, 'Dia do mês é obrigatório'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
});

type ScheduledFormData = z.infer<typeof scheduledSchema>;

export default function ScheduledPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<string | null>(null);

  const { transactions, isLoading, refresh } = useScheduledTransactions();
  const { categories } = useCategories();

  const form = useForm<ScheduledFormData>({
    resolver: zodResolver(scheduledSchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      amount: '',
      frequency: 'MONTHLY',
      dayOfMonth: '1',
      categoryId: '',
    },
  });

  const handleSubmit = async (data: ScheduledFormData) => {
    try {
      const nextRun = new Date();
      if (data.frequency === 'MONTHLY') {
        nextRun.setDate(parseInt(data.dayOfMonth));
        if (nextRun < new Date()) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }

      const result = await createScheduledTransaction({
        name: data.name,
        type: data.type as 'INCOME' | 'EXPENSE',
        amount: parseFloat(data.amount),
        frequency: data.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BUSINESS_DAYS',
        dayOfMonth: parseInt(data.dayOfMonth),
        categoryId: data.categoryId,
        nextRun: nextRun.toISOString(),
      });

      if (result.success) {
        showSuccess(
          'Agendamento criado com sucesso!',
          'A transação agendada foi criada e será executada automaticamente.',
        );
        setIsDialogOpen(false);
        form.reset();
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

  const handleDelete = (id: string) => {
    setSelectedToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedToDelete) {
      try {
        const result = await deleteScheduledTransaction(selectedToDelete);
        if (result.success) {
          showSuccess('Agendamento excluído com sucesso');
          refresh();
        } else {
          showError('Erro ao excluir agendamento', result.error);
        }
      } catch {
        showError('Erro ao excluir agendamento');
      }
      setIsDeleteOpen(false);
      setSelectedToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const frequencyLabels: Record<string, string> = {
    DAILY: 'Diário',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensal',
    BUSINESS_DAYS: 'Dias úteis',
  };

  const activeCount = transactions.filter((s) => s.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações Agendadas</h1>
          <p className="text-muted-foreground">Gerencie transações recorrentes e agendadas</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

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
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarClock className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum agendamento</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Crie agendamentos para transações recorrentes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((item) => (
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

      <FormDialog
        title="Novo Agendamento"
        description="Configure uma transação recorrente ou agendada"
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          form.reset();
        }}
        onSubmit={onSubmit}
        confirmText="Agendar"
        cancelText="Cancelar"
        isSubmitting={form.formState.isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">Receita</SelectItem>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel>Dia do mês</FormLabel>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </FormDialog>

      <DeleteConfirmModal
        title="Excluir Agendamento"
        description="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
