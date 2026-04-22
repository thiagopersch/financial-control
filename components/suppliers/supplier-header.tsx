'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SupplierModal } from './supplier-modal';

interface SupplierHeaderProps {
  userRole?: string;
}

export function SupplierHeader({ userRole }: SupplierHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canModify = userRole !== 'VIEWER';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Fornecedores
        </h1>
        <p className="text-muted-foreground">Gerencie os fornecedores de sua empresa.</p>
      </div>
      {canModify && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-indigo-600 shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 sm:w-auto dark:shadow-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      )}

      <SupplierModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
