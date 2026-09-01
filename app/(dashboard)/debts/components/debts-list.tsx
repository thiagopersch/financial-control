'use client';

import { DebtsCard } from '@/app/(dashboard)/debts/components/debts-card';
import { DebtsHeader } from '@/app/(dashboard)/debts/components/debts-header';
import { NotFoundDebts } from '@/app/(dashboard)/debts/components/not-found';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { ListPagination } from '@/components/ui/list-pagination';
import { Progress } from '@/components/ui/progress';
import { useDebtForm } from '@/hooks/forms/use-debt-form';
import { usePersistedPageFilters } from '@/hooks/use-persisted-page-filters';
import { DEBT_CLOSED_STATUSES, DEBT_OPEN_STATUSES } from '@/lib/constants/debt-status';
import type { DebtDTO } from '@/lib/queries/debts';
import {
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronUp,
  History,
  TrendingDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

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

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(10);
  const [showAllPaid, setShowAllPaid] = useState(false);

  const [activePaginationSlot, setActivePaginationSlot] = useState<HTMLDivElement | null>(null);

  usePersistedPageFilters(
    'debts',
    { search, categoryFilter, accountFilter, supplierFilter, statusFilter },
    (saved) => {
      if (saved.search !== undefined) setSearch(saved.search);
      if (saved.categoryFilter) setCategoryFilter(saved.categoryFilter);
      if (saved.accountFilter) setAccountFilter(saved.accountFilter);
      if (saved.supplierFilter) setSupplierFilter(saved.supplierFilter);
      if (saved.statusFilter) setStatusFilter(saved.statusFilter);
    },
  );

  const PAID_VISIBLE_LIMIT = 4;

  const { handleDelete } = useDebtForm({
    onSuccess: () => {
      onRefresh();
      setIsDeleteOpen(false);
      setDebtToDelete(null);
    },
  });

  const categoryOptions = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    debts.forEach((d) => {
      if (d.categoryId && d.categoryName) {
        map.set(d.categoryId, { name: d.categoryName, color: d.categoryColor ?? '#94a3b8' });
      }
    });
    return Array.from(map, ([id, { name, color }]) => ({ id, name, color })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [debts]);

  const accountOptions = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    debts.forEach((d) => {
      if (d.accountId && d.accountName) {
        map.set(d.accountId, { name: d.accountName, color: d.accountColor ?? '#94a3b8' });
      }
    });
    return Array.from(map, ([id, { name, color }]) => ({ id, name, color })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [debts]);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>();
    debts.forEach((d) => {
      if (d.supplierId && d.supplierName) map.set(d.supplierId, d.supplierName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [debts]);

  const filteredDebts = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return debts.filter((d) => {
      if (searchLower && !d.name.toLowerCase().includes(searchLower)) return false;
      if (categoryFilter !== 'all' && d.categoryId !== categoryFilter) return false;
      if (accountFilter !== 'all' && d.accountId !== accountFilter) return false;
      if (supplierFilter !== 'all' && d.supplierId !== supplierFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      return true;
    });
  }, [debts, search, categoryFilter, accountFilter, supplierFilter, statusFilter]);

  const resetPages = () => {
    setActivePage(1);
    setShowAllPaid(false);
  };

  const activeDebts = filteredDebts.filter((d) => DEBT_OPEN_STATUSES.includes(d.status));
  const paidDebts = filteredDebts.filter((d) => DEBT_CLOSED_STATUSES.includes(d.status));

  const paginatedActiveDebts = activeDebts.slice(
    (activePage - 1) * activePageSize,
    activePage * activePageSize,
  );
  const visiblePaidDebts = showAllPaid ? paidDebts : paidDebts.slice(0, PAID_VISIBLE_LIMIT);

  const allActiveDebts = debts.filter((d) => DEBT_OPEN_STATUSES.includes(d.status));
  const totalDebt = allActiveDebts.reduce((sum, d) => sum + d.currentValue, 0);
  const totalInitial = allActiveDebts.reduce((sum, d) => sum + d.initialValue, 0);
  const paidPercentage = totalInitial > 0 ? ((totalInitial - totalDebt) / totalInitial) * 100 : 0;

  const hasActiveFilters =
    search !== '' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    supplierFilter !== 'all' ||
    statusFilter !== 'all';

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    resetPages();
  };

  const handleApplyFilters = ({
    category,
    account,
    supplier,
    status,
  }: {
    category: string;
    account: string;
    supplier: string;
    status: string;
  }) => {
    setCategoryFilter(category);
    setAccountFilter(account);
    setSupplierFilter(supplier);
    setStatusFilter(status);
    resetPages();
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setAccountFilter('all');
    setSupplierFilter('all');
    setStatusFilter('all');
    resetPages();
  };

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
      <DebtsHeader
        onCreate={openCreate}
        searchParams={searchParams}
        onSearch={handleSearch}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        categoryFilter={categoryFilter}
        accountFilter={accountFilter}
        supplierFilter={supplierFilter}
        statusFilter={statusFilter}
        categoryOptions={categoryOptions}
        accountOptions={accountOptions}
        supplierOptions={supplierOptions}
        onApplyFilters={handleApplyFilters}
        onClearFilters={clearFilters}
        showActivePagination={activeDebts.length > 0}
        activePaginationSlotRef={setActivePaginationSlot}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allActiveDebts.length}</div>
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

      {debts.length > 0 && filteredDebts.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhuma dívida encontrada para os filtros selecionados.
        </p>
      )}

      {activeDebts.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paginatedActiveDebts.map((debt) => (
              <DebtsCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={openDelete} />
            ))}
          </div>
          <ListPagination
            page={activePage}
            pageSize={activePageSize}
            totalCount={activeDebts.length}
            onPageChange={setActivePage}
            onPageSizeChange={(size) => {
              setActivePageSize(size);
              setActivePage(1);
            }}
            paginationSlot={activePaginationSlot}
          />
        </div>
      )}

      {paidDebts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-t pt-6">
            <History className="text-muted-foreground h-4 w-4" />
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Histórico de dívidas encerradas
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {visiblePaidDebts.map((debt) => (
              <DebtsCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={openDelete} />
            ))}
          </div>
          {paidDebts.length > PAID_VISIBLE_LIMIT && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowAllPaid((v) => !v)}>
                {showAllPaid ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" /> Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" /> Mostrar mais (
                    {paidDebts.length - PAID_VISIBLE_LIMIT})
                  </>
                )}
              </Button>
            </div>
          )}
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
