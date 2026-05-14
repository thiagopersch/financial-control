'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showError, showSuccess } from '@/lib/utils/toast';
import { ArrowRightLeft, Download, FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ActionButtonsProps = {
  setIsTransferModalOpen: (open: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
};

export function ActionButtons({ setIsTransferModalOpen, setIsModalOpen }: ActionButtonsProps) {
  const searchParams = useSearchParams();

  const exportCSV = async () => {
    const params = new URLSearchParams(searchParams);
    const url = `/api/transactions/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccess('Exportação iniciada!', 'O download do arquivo CSV foi iniciado.');
  };

  const exportXLSX = async () => {
    try {
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/transactions/export?format=json&${params.toString()}`);
      const data = await response.json();

      if (!data.transactions || data.transactions.length === 0) {
        showError('Nenhuma transação para exportar');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(
        data.transactions.map((t: any) => ({
          Data: t.date,
          Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
          Categoria: t.categoryName,
          Fornecedor: t.supplierName || '',
          Valor: t.amount,
          Status: t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : 'Atrasado',
          Observações: t.notes || '',
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transações');
      XLSX.writeFile(wb, `transacoes-${new Date().toISOString().split('T')[0]}.xlsx`);
      showSuccess('Exportação concluída!', 'O arquivo Excel foi baixado.');
    } catch {
      showError('Erro ao exportar', 'Não foi possível exportar o arquivo.');
    }
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/transactions/export?format=json&${params.toString()}`);
      const data = await response.json();

      if (!data.transactions || data.transactions.length === 0) {
        showError('Nenhuma transação para exportar');
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Transações Financeiras', 14, 20);
      doc.setFontSize(10);
      doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
      doc.text(`Total de transações: ${data.transactions.length}`, 14, 35);

      const tableColumn = ['Data', 'Tipo', 'Categoria', 'Valor', 'Status'];
      const tableRows = data.transactions.map((t: any) => [
        t.date,
        t.type === 'INCOME' ? 'Receita' : 'Despesa',
        t.categoryName,
        `R$ ${Number(t.amount).toFixed(2)}`,
        t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : 'Atrasado',
      ]);

      autoTable(doc, {
        startY: 42,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`transacoes-${new Date().toISOString().split('T')[0]}.pdf`);
      showSuccess('Exportação concluída!', 'O arquivo PDF foi baixado.');
    } catch {
      showError('Erro ao exportar', 'Não foi possível exportar o arquivo.');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportCSV}>
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportXLSX}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel (XLSX)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
