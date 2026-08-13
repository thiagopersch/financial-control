'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface BudgetsTableProps {
  budgets: BudgetData[];
  onEdit: (budget: BudgetData) => void;
  onDelete: (budget: BudgetData) => void;
  paginationSlot?: HTMLDivElement | null;
  page: number;
  pageSize: number;
  totalCount: number;
}

export function BudgetsTable({
  budgets,
  onEdit,
  onDelete,
  paginationSlot,
  page,
  pageSize,
  totalCount,
}: BudgetsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const columns: ColumnDef<BudgetData>[] = [
    {
      accessorKey: 'category.name',
      header: 'Categoria',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: row.original.category?.color }}
          />
          <span className="font-medium">{row.original.category?.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Valor do Orçamento',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      id: 'spent',
      header: 'Valor Gasto',
      cell: ({ row }) => {
        const percent = row.original.percent || 0;
        const isOver = percent >= 100;
        const isWarning = percent >= 80 && percent < 100;
        return (
          <div className="min-w-[140px] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{formatCurrency(row.original.spent || 0)}</span>
              <span
                className={cn(
                  'font-semibold',
                  isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600',
                )}
              >
                {percent.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(percent, 100)}
              className={cn(
                'h-1.5',
                isOver
                  ? '[&>div]:bg-rose-500'
                  : isWarning
                    ? '[&>div]:bg-amber-500'
                    : '[&>div]:bg-emerald-500',
              )}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'month',
      header: 'Mês',
      cell: ({ row }) => monthNames[row.original.month - 1] || '-',
    },
    {
      accessorKey: 'year',
      header: 'Ano',
    },
    {
      accessorKey: 'alertAt80',
      header: 'Alertar aos 80%',
      cell: ({ row }) => (
        <Badge variant={row.original.alertAt80 ? 'secondary' : 'outline'}>
          {row.original.alertAt80 ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      accessorKey: 'alertAt100',
      header: 'Alertar ao Estourar',
      cell: ({ row }) => (
        <Badge variant={row.original.alertAt100 ? 'secondary' : 'outline'}>
          {row.original.alertAt100 ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="space-x-1 text-right whitespace-nowrap">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/20 h-8 w-8"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={budgets}
      emptyMessage="Nenhum orçamento configurado."
      paginationSlot={paginationSlot}
      manualPagination={{
        page,
        pageSize,
        totalCount,
        onPageChange: (p) => updateParam('page', String(p)),
        onPageSizeChange: (size) => {
          const params = new URLSearchParams(searchParams);
          params.set('pageSize', String(size));
          params.set('page', '1');
          router.push(`${window.location.pathname}?${params.toString()}`);
        },
      }}
    />
  );
}
