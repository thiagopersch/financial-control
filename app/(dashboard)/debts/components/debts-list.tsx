'use client';

import { DebtsCard } from '@/app/(dashboard)/debts/components/debts-card';
import { DebtsHeader } from '@/app/(dashboard)/debts/components/debts-header';
import { NotFoundDebts } from '@/app/(dashboard)/debts/components/not-found';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { Progress } from '@/components/ui/progress';
import { useDebtForm } from '@/hooks/forms/use-debt-form';
import type { DebtDTO } from '@/lib/queries/debts';
import { AlertTriangle, Calculator, History, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DebtsListProps {
  debts: DebtDTO[];
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export function DebtsList({ debts, onRefresh }: DebtsListProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);

  const { handleDelete } = useDebtForm({
    onSuccess: () => {
      onRefresh();
      setIsDeleteOpen(false);
      setDebtToDelete(null);
    },
  });

  const activeDebts = debts.filter((d) => d.isActive);
  const paidDebts = debts.filter((d) => !d.isActive);
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentValue, 0);
  const totalInitial = activeDebts.reduce((sum, d) => sum + d.initialValue, 0);
  const paidPercentage = totalInitial > 0 ? ((totalInitial - totalDebt) / totalInitial) * 100 : 0;

  const openCreate = () => {
    router.push('/debts/new');
  };

  const openEdit = (debt: DebtDTO) => {
    router.push(`/debts/${debt.id}/edit`);
  };

  const openDelete = (debt: DebtDTO) => {
    setDebtToDelete(debt.id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (debtToDelete) {
      await handleDelete(debtToDelete);
      setIsDeleteOpen(false);
      setDebtToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <DebtsHeader onCreate={openCreate} />

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

      {debts.length === 0 && <NotFoundDebts openCreate={openCreate} />}

      {activeDebts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {activeDebts.map((debt) => (
            <DebtsCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={openDelete} />
          ))}
        </div>
      )}

      {paidDebts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-t pt-6">
            <History className="text-muted-foreground h-4 w-4" />
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Histórico de dívidas pagas
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paidDebts.map((debt) => (
              <DebtsCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={openDelete} />
            ))}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        title="Exclusão de dívida"
        description="Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDebtToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
