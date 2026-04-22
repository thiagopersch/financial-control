import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Download, Plus } from 'lucide-react';

type ActionButtonsProps = {
  exportCSV: () => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
};

export function ActionButtons({
  exportCSV,
  setIsTransferModalOpen,
  setIsModalOpen,
}: ActionButtonsProps) {
  return (
    <>
      <Button variant="outline" size="lg" onClick={exportCSV} className="w-full sm:w-auto">
        <Download className="h-4 w-4" />
        Exportar
      </Button>

      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsTransferModalOpen(true)}
        className="w-full transition-all sm:w-auto"
      >
        <ArrowRightLeft className="h-4 w-4" />
        Transferir
      </Button>

      <Button
        size="lg"
        onClick={() => setIsModalOpen(true)}
        className="w-full transition-all sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Nova Transação
      </Button>
    </>
  );
}
