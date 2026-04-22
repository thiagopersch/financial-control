'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, ArrowUpDown, Edit, Trash, Zap } from 'lucide-react';
import { useState } from 'react';
import { DeleteRuleModal } from './delete-rule-modal';
import { RuleModal } from './rule-modal';

interface RulesListProps {
  rules: any[];
  categories: { id: string; name: string; type: string; color: string }[];
  userRole?: string;
}

export function RulesList({ rules, categories, userRole }: RulesListProps) {
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  const initialColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'keyword',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Palavra-chave
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm dark:bg-yellow-500/10 dark:font-bold">
            {row.original.keyword}
          </code>
        </div>
      ),
    },
    {
      id: 'arrow',
      header: '',
      cell: () => <ArrowRight className="text-muted-foreground h-4 w-4" />,
    },
    {
      accessorKey: 'categoryId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Categoria Associada
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const cat = getCategoryById(row.original.categoryId);
        return cat ? (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: cat.color + '20',
              color: cat.color,
              border: `1px solid ${cat.color}40`,
            }}
            className="font-medium"
          >
            {cat.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Categoria removida</span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="space-x-1 text-right whitespace-nowrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingRule(row.original)}
            className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingId(row.original.id)}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columns = initialColumns.filter((col) => col.id !== 'actions' || userRole !== 'VIEWER');

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={rules}
        emptyMessage="Nenhuma regra criada. Crie regras para categorizar transações automaticamente."
      />

      <RuleModal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        categories={categories}
        initialData={editingRule}
      />
      <DeleteRuleModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        id={deletingId || ''}
      />
    </div>
  );
}
