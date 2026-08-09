'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CostCentersHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function CostCentersHeader({ onCreate, paginationSlotRef }: CostCentersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Centros de Custo</h2>
        <p className="text-muted-foreground">Organize suas despesas por centro de custo.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={onCreate} className="h-10">
          <Plus className="mr-2 h-4 w-4" /> Novo Centro de Custo
        </Button>
        <div ref={paginationSlotRef} />
      </div>
    </div>
  );
}
