'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PaymentMethodsHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function PaymentMethodsHeader({ onCreate, paginationSlotRef }: PaymentMethodsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meios de Pagamento</h2>
        <p className="text-muted-foreground">
          Gerencie os meios de pagamento e vincule uma ou mais contas a cada um.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={onCreate} className="h-10">
          <Plus className="mr-2 h-4 w-4" /> Novo Meio de Pagamento
        </Button>
        <div ref={paginationSlotRef} />
      </div>
    </div>
  );
}
