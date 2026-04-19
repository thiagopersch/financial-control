'use client';

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
import { createCostCenter, deleteCostCenter } from '@/lib/actions/cost-centers';
import { useCostCenters } from '@/lib/queries/cost-centers';
import { showError, showSuccess, showValidationErrors } from '@/lib/utils/toast';
import { Building2, MoreHorizontal, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const costCenterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type CostCenterFormData = z.infer<typeof costCenterSchema>;

export default function CostCentersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { costCenters, isLoading, refresh } = useCostCenters();

  const form = useForm<CostCenterFormData>({
    defaultValues: {
      name: '',
      description: '',
      color: '#64748b',
    },
  });

  const onSubmit = async (data: CostCenterFormData) => {
    const result = costCenterSchema.safeParse(data);

    if (!result.success) {
      showValidationErrors(result.error);
      return;
    }

    try {
      const actionResult = await createCostCenter({
        name: data.name,
        description: data.description || undefined,
      });

      if (actionResult.success) {
        showSuccess('Centro de custo criado com sucesso');
        setIsDialogOpen(false);
        form.reset();
        refresh();
      } else {
        showError(actionResult.error || 'Erro ao criar centro de custo');
      }
    } catch (error) {
      showError('Erro ao criar centro de custo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este centro de custo?')) return;

    try {
      const result = await deleteCostCenter(id);

      if (result.success) {
        showSuccess('Centro de custo excluído com sucesso');
        refresh();
      } else {
        showError(result.error || 'Erro ao excluir centro de custo');
      }
    } catch (error) {
      showError('Erro ao excluir centro de custo');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground">
            Agrupe e categorize suas transações por centro de custo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Centro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Centro de Custo</DialogTitle>
              <DialogDescription>
                Crie um novo centro de custo para organizar suas transações
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: Pessoal, Empresa, Projetos"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  {...form.register('description')}
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  {...form.register('color')}
                  className="h-10 w-full"
                />
                {form.formState.errors.color && (
                  <p className="text-sm text-red-500">{form.formState.errors.color.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Criar Centro de Custo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="bg-muted h-6 w-32 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-20 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : costCenters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum centro de custo</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Crie seu primeiro centro de custo para organizar suas transações
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {costCenters.map((center) => (
            <Card key={center.id} style={{ borderLeftColor: center.color, borderLeftWidth: 4 }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" style={{ color: center.color }} />
                  <CardTitle className="text-lg">{center.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDelete(center.id)}
                      className="text-red-600"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                {center.description && (
                  <p className="text-muted-foreground text-sm">{center.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-muted-foreground text-xs">Despesas</p>
                      <p className="font-medium text-red-600">
                        {formatCurrency(center.totalExpense)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-muted-foreground text-xs">Receitas</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(center.totalIncome)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <p className="text-muted-foreground text-sm">
                    {center.transactionCount} transações
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
