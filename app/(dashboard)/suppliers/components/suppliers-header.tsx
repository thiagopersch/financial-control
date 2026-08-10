'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SuppliersHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function SuppliersHeader({ onCreate, paginationSlotRef }: SuppliersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Fornecedores</h2>
        <p className="text-muted-foreground">Gerencie seus fornecedores e parceiros comerciais.</p>
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button onClick={onCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo fornecedor
        </Button>
        <div ref={paginationSlotRef} />
      </div>
    </div>
  );
}
