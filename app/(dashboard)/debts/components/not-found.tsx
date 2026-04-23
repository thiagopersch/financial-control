'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function NotFoundDebts({ openCreate }: { openCreate: () => void }) {
  return (
    <div className="bg-muted/30 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
      <div className="bg-background mb-4 rounded-full p-4 shadow-sm">
        <AlertTriangle className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium">Nenhuma dívida cadastrada</h3>
      <p className="text-muted-foreground mb-4">
        Adicione suas dívidas para gerenciar suas parcelas.
      </p>
      <Button onClick={openCreate}>Adicionar Dívida</Button>
    </div>
  );
}
