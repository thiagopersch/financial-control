'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AccountsHeaderProps {
  onCreate: () => void;
}

export function AccountsHeader({ onCreate }: AccountsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Suas Contas</h2>
        <p className="text-muted-foreground">
          Gerencie seus bancos, carteiras e cartões em um só lugar.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" /> Nova Conta
      </Button>
    </div>
  );
}
