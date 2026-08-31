'use client';

import { BudgetsFilters } from '@/app/(dashboard)/budgets/components/budgets-filters';
import { BudgetsTable } from '@/app/(dashboard)/budgets/components/budgets-table';
import { BudgetDialog } from '@/components/budgets/budget-dialog';
import { MonthSelector } from '@/components/month-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { ListPageHeader } from '@/components/ui/list-page-header';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { deleteBudget } from '@/lib/actions/budgets';
import { usePersistedFiltersStore } from '@/hooks/use-filters-store';
import { PieChart } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const ALLOWED_PAGE_SIZES = [10, 20, 50, 100];

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetData {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertAt80: boolean;
  alertAt100: boolean;
  category: Category;
  spent?: number;
  percent?: number;
}

interface BudgetsPageClientProps {
  categories: Category[];
}

function parseMonthParams(
  yearStr: string | null,
  monthStr: string | null,
): { month: number; year: number; isAllPeriod: boolean; isYear: boolean } {
  const now = new Date();

  // Novos parâmetros: year e month
  if (!yearStr) {
    // Sem parâmetros - usa mês atual
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      isAllPeriod: false,
      isYear: false,
    };
  }

  if (yearStr === 'all') {
    return { month: 0, year: 0, isAllPeriod: true, isYear: false };
  }

  if (monthStr === 'all') {
    return { month: 0, year: parseInt(yearStr), isAllPeriod: false, isYear: true };
  }

  if (monthStr) {
    return {
      month: parseInt(monthStr),
      year: parseInt(yearStr),
      isAllPeriod: false,
      isYear: false,
    };
  }

  // Apenas ano selecionado sem mês - treated as full year
  return { month: 0, year: parseInt(yearStr), isAllPeriod: false, isYear: true };
}

export function BudgetsPageClient({ categories }: BudgetsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filtersStore = usePersistedFiltersStore();
  const hydrated = useRef(false);
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    selected: editingBudget,
    isFormOpen: isDialogOpen,
    openCreate: openCreateBudget,
    openEdit: openEditBudget,
    close: closeBudgetDialog,
  } = useCrudDialogState<BudgetData>();

  const {
    isOpen: isDeleteDialogOpen,
    idToDelete: budgetToDelete,
    requestDelete: handleDelete,
    confirmDelete: handleConfirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm<BudgetData>((budget) => deleteBudget(budget.id), {
    successMessage: 'Orçamento excluído com sucesso.',
    errorMessage: 'Erro ao excluir orçamento',
    onSuccess: () => fetchBudgets(),
  });

  const { month, year, isAllPeriod, isYear } = parseMonthParams(yearParam, monthParam);

  const pageSizeParam = Number(searchParams.get('pageSize'));
  const pageSize = ALLOWED_PAGE_SIZES.includes(pageSizeParam) ? pageSizeParam : 10;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const hasActiveFilters = !!categoryParam;

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (isAllPeriod) {
        params.set('all', 'true');
      } else if (isYear) {
        params.set('year', String(year));
      } else if (month > 0 && year > 0) {
        params.set('month', String(month));
        params.set('year', String(year));
      } else {
        const now = new Date();
        params.set('month', String(now.getMonth() + 1));
        params.set('year', String(now.getFullYear()));
      }

      if (qParam) params.set('q', qParam);
      if (categoryParam) params.set('category', categoryParam);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const url = `/api/budgets?${params.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
        setTotalCount(data.totalCount ?? 0);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, isAllPeriod, isYear, monthParam, qParam, categoryParam, page, pageSize]);

  useEffect(() => {
    fetchBudgets();
  }, [month, year, isAllPeriod, isYear, qParam, categoryParam, page, pageSize]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (hasActiveFilters) return;

    const saved = filtersStore.filtersByPage[pathname];
    if (!saved) return;

    const params = new URLSearchParams(searchParams);
    for (const [key, value] of new URLSearchParams(saved)) {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (params: URLSearchParams) => {
    params.delete('page');

    const toPersist = new URLSearchParams(params);
    toPersist.delete('q');
    toPersist.delete('year');
    toPersist.delete('month');
    if (Array.from(toPersist.keys()).length > 0) {
      filtersStore.setPageFilters(pathname, toPersist.toString());
    } else {
      filtersStore.clearPageFilters(pathname);
    }

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    applyFilters(params);
  };

  const handleClearFilters = () => {
    filtersStore.clearPageFilters(pathname);
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    params.delete('category');
    params.delete('page');
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSuccess = async () => {
    await fetchBudgets();
  };

  const handleEdit = (budget: BudgetData) => {
    openEditBudget({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      alertAt80: budget.alertAt80,
      alertAt100: budget.alertAt100,
      category: budget.category,
    });
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return (
    <div className="space-y-6">
      <ListPageHeader
        headerActions={<MonthSelector useNextYears={true} />}
        searchParams={searchParams}
        onSearch={handleSearch}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        createLabel="Novo Orçamento"
        onCreate={openCreateBudget}
        paginationSlotRef={setPaginationSlot}
        filtersPanel={
          <BudgetsFilters
            searchParams={searchParams}
            applyFilters={applyFilters}
            handleClearFilters={handleClearFilters}
            categories={categories}
          />
        }
      />

      <div className="text-muted-foreground text-sm">
        {isAllPeriod ? (
          <>Exibindo todos os orçamentos</>
        ) : isYear ? (
          <>
            Exibindo orçamentos de <span className="font-medium">{year}</span>
          </>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="bg-muted h-4 w-24 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-16 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length > 0 ? (
        <BudgetsTable
          budgets={budgets}
          onEdit={handleEdit}
          onDelete={handleDelete}
          paginationSlot={paginationSlot}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
        />
      ) : (
        <Card className="col-span-full py-20">
          <CardContent className="flex flex-col items-center space-y-4 text-center">
            <div className="bg-muted rounded-full p-4">
              <PieChart className="text-muted-foreground h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">Nenhum orçamento configurado</h3>
              <p className="text-muted-foreground mx-auto max-w-xs">
                Defina limites para suas categorias e receba alertas quando estiver próximo de
                atingi-los.
              </p>
            </div>
            <Button variant="outline" className="mt-4" onClick={openCreateBudget}>
              Começar agora
            </Button>
          </CardContent>
        </Card>
      )}

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeBudgetDialog()}
        categories={categories}
        editingBudget={editingBudget}
        onSuccess={handleSuccess}
      />

      <DeleteConfirmModal
        title="Excluir Orçamento"
        description={`Tem certeza que deseja excluir o orçamento de "${budgetToDelete?.category.name}"? Esta ação não pode ser desfeita.`}
        isOpen={isDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
