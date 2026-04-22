'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CreditCardsHeaderProps {
  onCreate: () => void;
}

export function CreditCardsHeader({ onCreate }: CreditCardsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h2>
        <p className="text-muted-foreground">Gerencie seus cartões de crédito e faturas.</p>
      </div>
      <Button onClick={onCreate} className="h-10">
        <Plus className="mr-2 h-4 w-4" /> Novo Cartão
      </Button>
    </div>
  );
}
