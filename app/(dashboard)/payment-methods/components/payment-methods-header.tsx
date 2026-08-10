'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PaymentMethodsHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function PaymentMethodsHeader({ onCreate, paginationSlotRef }: PaymentMethodsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meios de Pagamento</h2>
        <p className="text-muted-foreground">
          Gerencie os meios de pagamento e vincule uma ou mais contas a cada um.
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button onClick={onCreate} className="h-10 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo Meio de Pagamento
        </Button>
        <div ref={paginationSlotRef} />
      </div>
    </div>
  );
}
