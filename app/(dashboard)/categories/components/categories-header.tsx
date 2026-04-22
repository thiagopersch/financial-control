'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CategoriesHeaderProps {
  onCreate: () => void;
  userRole?: string;
}

export function CategoriesHeader({ onCreate, userRole }: CategoriesHeaderProps) {
  const canModify = userRole !== 'VIEWER';

  return (
    <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Categorias</h2>
        <p className="text-muted-foreground">
          Organize suas transações com categorias personalizadas.
        </p>
      </div>

      {canModify && (
        <Button onClick={onCreate} className="max-md:w-full">
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      )}
    </div>
  );
}
