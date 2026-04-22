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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDebt, deleteDebt, updateDebt } from '@/lib/actions/debts';
import type { DebtDTO } from '@/lib/queries/debts';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Calculator,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
  TrendingDown,
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
type Account = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z
    .string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => parseFloat(val) > 0, 'Valor deve ser maior que zero'),
  interestRate: z.string().optional(),
  minimumPayment: z
    .string()
    .min(1, 'Pagamento mínimo é obrigatório')
    .refine((val) => parseFloat(val) > 0, 'Pagamento mínimo deve ser maior que zero'),
  dueDay: z.string().optional(),
  installments: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
});

type DebtFormValues = z.infer<typeof debtSchema>;

interface DebtsFormProps {
  initialDebts: DebtDTO[];
  initialAccounts: Account[];
}

export function DebtsForm({ initialDebts, initialAccounts }: DebtsFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtDTO | null>(null);
  const [debts, setDebts] = useState<DebtDTO[]>(initialDebts);
  const [accounts] = useState<Account[]>(initialAccounts);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: '',
      description: '',
      initialValue: '',
      interestRate: '',
      minimumPayment: '',
      dueDay: '',
      installments: '',
      accountId: '',
    },
  });

  const editForm = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: '',
      description: '',
      initialValue: '',
      interestRate: '',
      minimumPayment: '',
      dueDay: '',
      installments: '',
      accountId: '',
    },
  });

  const refresh = () => {
    window.location.reload();
  };

  const onSubmit = async (data: DebtFormValues) => {
    try {
      const initialValue = parseFloat(data.initialValue);
      const minimumPayment = parseFloat(data.minimumPayment);
      const interestRate = data.interestRate ? parseFloat(data.interestRate) : undefined;
      const dueDay = data.dueDay ? parseInt(data.dueDay) : undefined;
      const installments = data.installments ? parseInt(data.installments) : undefined;

      if (isNaN(initialValue) || isNaN(minimumPayment)) {
        showError('Valores inválidos', 'Por favor, preencha os campos de valor corretamente');
        return;
      }

      if (interestRate !== undefined && isNaN(interestRate)) {
        showError('Taxa de juros inválida', 'Por favor, insira um número válido ou deixe vazio');
        return;
      }

      const result = await createDebt({
        name: data.name,
        description: data.description || undefined,
        initialValue,
        currentValue: initialValue,
        interestRate,
        minimumPayment,
        dueDay,
        installments,
        accountId: data.accountId,
        startDate: new Date().toISOString(),
      });

      if (result.success) {
        showSuccess('Dívida criada com sucesso');
        setIsDialogOpen(false);
        form.reset();
        refresh();
      } else {
        showError('Erro ao criar dívida', result.error);
      }
    } catch (error) {
      showError('Erro ao criar dívida');
    }
  };

  const onEditSubmit = async (data: DebtFormValues) => {
    if (!selectedDebt) return;

    try {
      const interestRate = data.interestRate ? parseFloat(data.interestRate) : undefined;
      const dueDay = data.dueDay ? parseInt(data.dueDay) : undefined;

      if (interestRate !== undefined && isNaN(interestRate)) {
        showError('Taxa de juros inválida', 'Por favor, insira um número válida ou deixe vazio');
        return;
      }

      const result = await updateDebt(selectedDebt.id, {
        name: data.name,
        description: data.description || undefined,
        interestRate,
        dueDay,
        startDate: selectedDebt.startDate,
      });

      if (result.success) {
        showSuccess('Dívida atualizada com sucesso');
        setIsEditDialogOpen(false);
        setSelectedDebt(null);
        editForm.reset();
        refresh();
      } else {
        showError('Erro ao atualizar dívida', result.error);
      }
    } catch (error) {
      showError('Erro ao atualizar dívida');
    }
  };

  const handleEdit = (debt: DebtDTO) => {
    setSelectedDebt(debt);
    editForm.reset({
      name: debt.name,
      description: debt.description || '',
      initialValue: debt.initialValue.toString(),
      interestRate: debt.interestRate?.toString() || '',
      minimumPayment: debt.minimumPayment.toString(),
      dueDay: debt.dueDay?.toString() || '',
      installments: debt.installments?.toString() || '',
      accountId: '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (debt: DebtDTO) => {
    setSelectedDebt(debt);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDebt) return;

    try {
      const result = await deleteDebt(selectedDebt.id);
      if (result.success) {
        showSuccess('Dívida excluída com sucesso');
        setIsDeleteDialogOpen(false);
        setSelectedDebt(null);
        refresh();
      } else {
        showError('Erro ao excluir dívida', result.error);
      }
    } catch (error) {
      showError('Erro ao excluir dívida');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const activeDebts = debts.filter((d) => d.isActive);
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentValue, 0);
  const totalInitial = activeDebts.reduce((sum, d) => sum + d.initialValue, 0);
  const paidPercentage = totalInitial > 0 ? ((totalInitial - totalDebt) / totalInitial) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dívidas e Financiamentos</h1>
          <p className="text-muted-foreground">Gerencie suas dívidas e simule quitação</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Dívida</DialogTitle>
              <DialogDescription>Adicione uma nova dívida ou financiamento</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...form.register('name')} placeholder="Ex: Empréstimo do banco" />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input id="description" {...form.register('description')} placeholder="Descrição" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialValue">Valor Total</Label>
                  <Input
                    id="initialValue"
                    type="number"
                    step="0.01"
                    {...form.register('initialValue')}
                    placeholder="0.00"
                  />
                  {form.formState.errors.initialValue && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.initialValue.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Pagamento Mínimo</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    step="0.01"
                    {...form.register('minimumPayment')}
                    placeholder="0.00"
                  />
                  {form.formState.errors.minimumPayment && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.minimumPayment.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    {...form.register('interestRate')}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Dia de Vencimento</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    {...form.register('dueDay')}
                    placeholder="1-31"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    {...form.register('installments')}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountId">Conta para Pagamento</Label>
                <Controller
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: account.color || '#000000' }}
                              />
                              {account.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.accountId && (
                  <p className="text-sm text-red-500">{form.formState.errors.accountId.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Criando...' : 'Criar Dívida'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Dívida</DialogTitle>
              <DialogDescription>Atualize os dados da dívida</DialogDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input id="edit-name" {...editForm.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição (opcional)</Label>
                <Input id="edit-description" {...editForm.register('description')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-initialValue">Valor Total</Label>
                  <Input id="edit-initialValue" disabled {...editForm.register('initialValue')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minimumPayment">Pagamento Mínimo</Label>
                  <Input
                    id="edit-minimumPayment"
                    disabled
                    {...editForm.register('minimumPayment')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-interestRate">Taxa de Juros (%)</Label>
                  <Input
                    id="edit-interestRate"
                    type="number"
                    step="0.01"
                    {...editForm.register('interestRate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDay">Dia de Vencimento</Label>
                  <Input
                    id="edit-dueDay"
                    type="number"
                    min="1"
                    max="31"
                    {...editForm.register('dueDay')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-installments">Parcelas</Label>
                  <Input id="edit-installments" disabled {...editForm.register('installments')} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Dívida</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a dívida &quot;{selectedDebt?.name}&quot;? Todas as{' '}
                {selectedDebt?.installments || 0} transações vinculadas serão excluídas.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDebts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Pago</CardTitle>
            <Calculator className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInitial - totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidPercentage.toFixed(1)}%</div>
            <Progress value={paidPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {debts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma dívida cadastrada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Adicione suas dívidas para gerenciar suas parcelas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debts.map((debt) => {
            const debtPaid = debt.initialValue - debt.currentValue;
            const debtPercentage = (debtPaid / debt.initialValue) * 100;

            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`h-5 w-5 ${debt.isActive ? 'text-red-500' : 'text-gray-400'}`}
                    />
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                    <Badge variant={debt.isActive ? 'default' : 'secondary'}>
                      {debt.isActive ? 'Ativa' : 'Quitada'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(debt)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(debt)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Original:</span>
                      <span className="font-medium">{formatCurrency(debt.initialValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Atual:</span>
                      <span className="font-medium text-red-500">
                        {formatCurrency(debt.currentValue)}
                      </span>
                    </div>
                    {debt.interestRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Juros:</span>
                        <span className="font-medium">{debt.interestRate}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pagamento Mínimo:</span>
                      <span className="font-medium">{formatCurrency(debt.minimumPayment)}</span>
                    </div>
                    {debt.installments && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Parcelas:</span>
                        <span className="font-medium">{debt.installments}x</span>
                      </div>
                    )}
                    <Progress value={debtPercentage} className="mt-2" />
                    <p className="text-muted-foreground text-right text-xs">
                      {debtPercentage.toFixed(1)}% pago
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
