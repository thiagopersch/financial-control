import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function NotFoundAccounts({ openCreate }: { openCreate: () => void }) {
  return (
    <div className="bg-muted/30 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
      <div className="bg-background mb-4 rounded-full p-4 shadow-sm">
        <Plus className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
      <p className="text-muted-foreground mb-4">
        Comece adicionando sua primeira conta de banco ou carteira.
      </p>
      <Button onClick={openCreate}>Adicionar Conta</Button>
    </div>
  );
}
