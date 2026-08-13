'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Filter, X } from 'lucide-react';

interface FilterPanelProps {
  children: React.ReactNode;
  onApply: () => void;
  onClear: () => void;
  applyLabel?: string;
  clearLabel?: string;
  /** Overrides the default `md:grid-cols-4` for panels with more/fewer fields. */
  gridClassName?: string;
}

export function FilterPanel({
  children,
  onApply,
  onClear,
  applyLabel = 'Filtrar',
  clearLabel = 'Limpar',
  gridClassName,
}: FilterPanelProps) {
  return (
    <div className="dark:bg-accent dark:text-accent-foreground text-foreground flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className={cn('grid grid-cols-1 items-end gap-4 md:grid-cols-4', gridClassName)}>
        {children}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          type="button"
          onClick={onClear}
          className="w-full border-2 border-dashed font-medium text-red-500 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-500 sm:w-auto dark:hover:border-red-500 dark:hover:bg-red-500/10"
        >
          <X className="h-4 w-4" />
          {clearLabel}
        </Button>
        <Button type="button" onClick={onApply} className="w-full sm:w-auto">
          <Filter className="h-4 w-4" />
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">{label}</span>
      {children}
    </div>
  );
}
