'use client';

import { GoalsWidget } from '@/components/dashboard/goals-widget';
import { DepositDialog } from '@/components/goals/deposit-dialog';
import { GoalDialog } from '@/components/goals/goal-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { Input } from '@/components/ui/input';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { ListPagination } from '@/components/ui/list-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteGoal } from '@/lib/actions/goals';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { GoalData } from '@/types/goal';
import { Plus, Rocket, Target } from 'lucide-react';
import { useMemo, useState } from 'react';

interface GoalsPageClientProps {
  initialGoals: GoalData[];
}

type StatusFilter = 'all' | 'active' | 'completed';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'completed', label: 'Concluídas' },
];

const PAGE_SIZE_DEFAULT = 10;

export function GoalsPageClient({ initialGoals }: GoalsPageClientProps) {
  const [goals, setGoals] = useState<GoalData[]>(initialGoals);

  const {
    selected: editingGoal,
    isFormOpen: isDialogOpen,
    openCreate: openCreateGoal,
    openEdit: openEditGoal,
    close: closeGoalDialog,
  } = useCrudDialogState<any>();

  const {
    isOpen: isDeleteDialogOpen,
    idToDelete: deleteGoalId,
    requestDelete: handleDeleteClick,
    confirmDelete: handleDeleteConfirm,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteGoal, {
    successMessage: 'Meta excluída com sucesso',
    errorMessage: 'Erro ao excluir meta',
    onSuccess: (goalId) => setGoals((prev) => prev.filter((g) => g.id !== goalId)),
  });

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [currentMin, setCurrentMin] = useState('');
  const [currentMax, setCurrentMax] = useState('');
  const [targetMin, setTargetMin] = useState('');
  const [targetMax, setTargetMax] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState<Date | undefined>(undefined);
  const [deadlineTo, setDeadlineTo] = useState<Date | undefined>(undefined);
  const [colorFilter, setColorFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    goals.forEach((goal) => {
      if (goal.color) set.add(goal.color);
    });
    return Array.from(set);
  }, [goals]);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    currentMin !== '' ||
    currentMax !== '' ||
    targetMin !== '' ||
    targetMax !== '' ||
    deadlineFrom !== undefined ||
    deadlineTo !== undefined ||
    colorFilter !== 'all';

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setCurrentMin('');
    setCurrentMax('');
    setTargetMin('');
    setTargetMax('');
    setDeadlineFrom(undefined);
    setDeadlineTo(undefined);
    setColorFilter('all');
    setPage(1);
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch = goal.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && goal.isActive) ||
      (statusFilter === 'completed' && !goal.isActive);

    const minCurrent = currentMin !== '' ? Number(currentMin) : null;
    const maxCurrent = currentMax !== '' ? Number(currentMax) : null;
    const matchesCurrentMin = minCurrent === null || goal.currentAmount >= minCurrent;
    const matchesCurrentMax = maxCurrent === null || goal.currentAmount <= maxCurrent;

    const minTarget = targetMin !== '' ? Number(targetMin) : null;
    const maxTarget = targetMax !== '' ? Number(targetMax) : null;
    const matchesTargetMin = minTarget === null || goal.targetAmount >= minTarget;
    const matchesTargetMax = maxTarget === null || goal.targetAmount <= maxTarget;

    let matchesDeadline = true;
    if (deadlineFrom || deadlineTo) {
      if (!goal.deadline) {
        matchesDeadline = false;
      } else {
        const deadlineTime = new Date(goal.deadline).getTime();
        if (deadlineFrom && deadlineTime < deadlineFrom.getTime()) matchesDeadline = false;
        if (deadlineTo && deadlineTime > deadlineTo.getTime()) matchesDeadline = false;
      }
    }

    const matchesColor = colorFilter === 'all' || goal.color === colorFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCurrentMin &&
      matchesCurrentMax &&
      matchesTargetMin &&
      matchesTargetMax &&
      matchesDeadline &&
      matchesColor
    );
  });

  const totalCount = filteredGoals.length;
  const pageGoals = filteredGoals.slice((page - 1) * pageSize, page * pageSize);

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleEdit = (goal: GoalData) => {
    openEditGoal({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : null,
      color: goal.color || '#0ea5e9',
    });
  };

  const handleDelete = async (goalId: string) => {
    const result = await deleteGoal(goalId);
    if (result.success) {
      showSuccess('Meta excluída com sucesso');
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } else {
      showError(result.error || 'Erro ao excluir meta');
    }
  };

  const handleDeposit = (goalId: string) => {
    setDepositGoalId(goalId);
  };

  const handleDepositSuccess = (newAmount: number) => {
    setGoals(
      goals.map((g) =>
        g.id === depositGoalId
          ? {
              ...g,
              currentAmount: newAmount,
              percent: Math.min((newAmount / g.targetAmount) * 100, 100),
            }
          : g,
      ),
    );
  };

  const currentDepositGoal = goals.find((g) => g.id === depositGoalId);

  return (
    <div className="space-y-6">
      {goals.length > 0 && (
        <ListPageHeader
          searchParams={searchParams}
          onSearch={handleSearch}
          hasActiveFilters={hasActiveFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          createLabel="Nova Meta"
          onCreate={openCreateGoal}
          paginationSlotRef={setPaginationSlot}
        />
      )}

      {goals.length === 0 && (
        <div className="flex justify-end">
          <Button className="gap-2" onClick={openCreateGoal}>
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      )}

      {goals.length > 0 && showFilters && (
        <FilterPanel
          onApply={() => setPage(1)}
          onClear={handleClearFilters}
          gridClassName="md:grid-cols-3 lg:grid-cols-4"
        >
          <FilterField label="Status">
            <Select
              value={statusFilter}
              onValueChange={(value) => handleStatusFilterChange(value as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Valor atual">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="De"
                className="bg-background h-10 shadow-sm"
                value={currentMin}
                onChange={(e) => {
                  setCurrentMin(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="number"
                placeholder="Até"
                className="bg-background h-10 shadow-sm"
                value={currentMax}
                onChange={(e) => {
                  setCurrentMax(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </FilterField>

          <FilterField label="Valor alvo">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="De"
                className="bg-background h-10 shadow-sm"
                value={targetMin}
                onChange={(e) => {
                  setTargetMin(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="number"
                placeholder="Até"
                className="bg-background h-10 shadow-sm"
                value={targetMax}
                onChange={(e) => {
                  setTargetMax(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </FilterField>

          <FilterField label="Cor">
            <Select
              value={colorFilter}
              onValueChange={(value) => {
                setColorFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todas as cores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cores</SelectItem>
                {colorOptions.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {color}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Prazo de">
            <DatePicker
              date={deadlineFrom}
              setDate={(date) => {
                setDeadlineFrom(date);
                setPage(1);
              }}
            />
          </FilterField>

          <FilterField label="Prazo até">
            <DatePicker
              date={deadlineTo}
              setDate={(date) => {
                setDeadlineTo(date);
                setPage(1);
              }}
            />
          </FilterField>
        </FilterPanel>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {goals.length === 0 ? (
          <Card className="col-span-full py-20">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-muted rounded-full p-4">
                <Target className="text-muted-foreground h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Qual seu próximo sonho?</h3>
                <p className="text-muted-foreground mx-auto max-w-xs">
                  Seja uma reserva de emergência, uma viagem ou um novo carro, definir metas é o
                  primeiro passo para conquistar.
                </p>
              </div>
              <Button variant="outline" className="mt-4 gap-2" onClick={openCreateGoal}>
                <Rocket className="h-4 w-4" />
                Criar minha primeira meta
              </Button>
            </CardContent>
          </Card>
        ) : totalCount === 0 ? (
          <Card className="col-span-full py-20">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-muted rounded-full p-4">
                <Target className="text-muted-foreground h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Nenhuma meta encontrada</h3>
                <p className="text-muted-foreground mx-auto max-w-xs">
                  Ajuste a busca ou o filtro de status para encontrar suas metas.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pageGoals.map((goal) => (
            <div key={goal.id} className="lg:col-span-1">
              <GoalsWidget
                goals={[goal]}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDeleteClick={handleDeleteClick}
                onDeposit={handleDeposit}
              />
            </div>
          ))
        )}
      </div>

      {totalCount > 0 && (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          paginationSlot={paginationSlot}
        />
      )}

      <GoalDialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeGoalDialog()}
        editingGoal={editingGoal}
        onSuccess={handleSuccess}
      />

      {currentDepositGoal && (
        <DepositDialog
          open={depositGoalId !== null}
          onOpenChange={(open) => !open && setDepositGoalId(null)}
          goalId={currentDepositGoal.id}
          goalName={currentDepositGoal.name}
          currentAmount={currentDepositGoal.currentAmount}
          targetAmount={currentDepositGoal.targetAmount}
          onDepositSuccess={handleDepositSuccess}
        />
      )}

      {deleteGoalId && (
        <DeleteConfirmModal
          isOpen={isDeleteDialogOpen}
          onClose={cancelDelete}
          onConfirm={handleDeleteConfirm}
          title="Excluir Meta"
          description={`Tem certeza que deseja excluir a meta "${
            goals.find((g) => g.id === deleteGoalId)?.name || ''
          }"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
