'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SuppliersHeaderProps {
  onCreate: () => void;
}

export function SuppliersHeader({ onCreate }: SuppliersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Fornecedores</h2>
        <p className="text-muted-foreground">Gerencie seus fornecedores e parceiros comerciais.</p>
      </div>
      <Button onClick={onCreate} className="h-10">
        <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
      </Button>
    </div>
  );
}
