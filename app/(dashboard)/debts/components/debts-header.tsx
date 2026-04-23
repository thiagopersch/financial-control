'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DebtsHeaderProps {
  onCreate: () => void;
}

export function DebtsHeader({ onCreate }: DebtsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold tracking-tight">Dívidas e Financiamentos</h2>
        <p className="text-muted-foreground">Gerencie suas dívidas e simule quitação.</p>
      </div>
      <Button onClick={onCreate} className="w-full md:w-auto">
        <Plus className="mr-2 h-4 w-4" /> Nova Dívida
      </Button>
    </div>
  );
}
