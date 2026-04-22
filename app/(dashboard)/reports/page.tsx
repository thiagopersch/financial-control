'use client';

import { useState } from 'react';
import { FileBarChart, Download, FileText, Table } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const metrics = [
  { id: 'total_income', label: 'Receita Total', type: 'income' },
  { id: 'total_expense', label: 'Despesa Total', type: 'expense' },
  { id: 'net_result', label: 'Resultado Líquido', type: 'both' },
  { id: 'by_category', label: 'Por Categoria', type: 'both' },
  { id: 'by_account', label: 'Por Conta', type: 'both' },
  { id: 'by_cost_center', label: 'Por Centro de Custo', type: 'both' },
];

const periods = [
  { value: 'current_month', label: 'Mês Atual' },
  { value: 'last_month', label: 'Mês Passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
  { value: 'last_6_months', label: 'Últimos 6 meses' },
  { value: 'current_year', label: 'Ano Atual' },
  { value: 'custom', label: 'Personalizado' },
];

export default function ReportsPage() {
  const [selectedMetric, setSelectedMetric] = useState('total_expense');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `relatorio_${selectedMetric}_${timestamp}`;

    if (exportFormat === 'csv') {
      const csvContent =
        'data:text/csv;charset=utf-8,Categoria,Valor\nAlimentação,1500\nTransporte,500\nLazer,300';
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Customizáveis</h1>
        <p className="text-muted-foreground">Crie e exporte relatórios personalizados</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Métrica</label>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Formato</label>
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Excel)</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {}}>
          <Table className="mr-2 h-4 w-4" />
          Visualizar Tabela
        </Button>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Visualização Gráfica</CardTitle>
              <CardDescription>
                Métrica: {metrics.find((m) => m.id === selectedMetric)?.label} | Período:{' '}
                {periods.find((p) => p.value === selectedPeriod)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[400px] items-center justify-center">
              <div className="text-muted-foreground text-center">
                <FileBarChart className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p>Selecione as opções acima e clique em Exportar</p>
                <p className="text-sm">Funcionalidade de gráfico em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Categoria</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                      <th className="px-4 py-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-2">Alimentação</td>
                      <td className="px-4 py-2 text-right">R$ 1.500,00</td>
                      <td className="px-4 py-2 text-right">30%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2">Transporte</td>
                      <td className="px-4 py-2 text-right">R$ 500,00</td>
                      <td className="px-4 py-2 text-right">10%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2">Lazer</td>
                      <td className="px-4 py-2 text-right">R$ 300,00</td>
                      <td className="px-4 py-2 text-right">6%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
