'use client';

import { useReports } from '@/lib/queries/reports-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useState, useCallback } from 'react';
import { Download, FileBarChart, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
];

const COLORS = [
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
];

export default function ReportsPage() {
  const [selectedMetric, setSelectedMetric] = useState('total_expense');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'xlsx'>('xlsx');

  const { chartData, tableData, summary, isLoading } = useReports(selectedMetric, selectedPeriod);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);

  const exportCSV = (filename: string) => {
    const summaryRows = summary
      ? `Indicador,Valor\nReceitas,${summary.totalIncome.toFixed(2)}\nDespesas,${summary.totalExpense.toFixed(2)}\nResultado Líquido,${summary.netResult.toFixed(2)}\nTransações,${summary.transactionCount}\n\n`
      : '';
    const headers = 'Categoria,Valor,Porcentagem\n';
    const rows = tableData
      .map((row) => `${row.category},${row.value.toFixed(2)},${row.percentage}%`)
      .join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(summaryRows + headers + rows)}`;
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportXLSX = (filename: string) => {
    const wb = XLSX.utils.book_new();

    if (summary) {
      const summaryData = [
        { Indicador: 'Receitas', Valor: summary.totalIncome },
        { Indicador: 'Despesas', Valor: summary.totalExpense },
        { Indicador: 'Resultado Líquido', Valor: summary.netResult },
        { Indicador: 'Total de Transações', Valor: summary.transactionCount },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    }

    const detailData = tableData.map((row) => ({
      Categoria: row.category,
      Valor: row.value,
      Porcentagem: `${row.percentage}%`,
    }));
    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhamento');

    if (sortedChartData.length > 0) {
      const chartDataWs = XLSX.utils.json_to_sheet(
        sortedChartData.map((d) => ({
          Categoria: d.name,
          Valor: d.value,
          Porcentagem: `${((d.value / (summary?.totalIncome || summary?.totalExpense || 1)) * 100).toFixed(1)}%`,
        })),
      );
      XLSX.utils.book_append_sheet(wb, chartDataWs, 'Gráfico');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportPDF = (filename: string) => {
    const doc = new jsPDF();
    const metricLabel = metrics.find((m) => m.id === selectedMetric)?.label || '';
    const periodLabel = periods.find((p) => p.value === selectedPeriod)?.label || '';

    doc.setFontSize(18);
    doc.text('Relatório Financeiro', 14, 20);
    doc.setFontSize(11);
    doc.text(`Métrica: ${metricLabel}`, 14, 30);
    doc.text(`Período: ${periodLabel}`, 14, 37);

    if (summary) {
      doc.setFontSize(10);
      doc.text(`Receitas: ${formatCurrency(summary.totalIncome)}`, 14, 47);
      doc.text(`Despesas: ${formatCurrency(summary.totalExpense)}`, 14, 54);
      doc.text(`Resultado Líquido: ${formatCurrency(summary.netResult)}`, 14, 61);
      doc.text(`Total de transações: ${summary.transactionCount}`, 14, 68);
    }

    const tableColumn = ['Categoria', 'Valor', '%'];
    const tableRows = tableData.map((row) => [
      row.category,
      formatCurrency(row.value),
      `${row.percentage}%`,
    ]);

    autoTable(doc, {
      startY: summary ? 75 : 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 75;
    if (sortedChartData.length > 0 && finalY < 230) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Distribuição por Categoria', 14, 20);
      const chartRows = sortedChartData.map((d, i) => [
        `${i + 1}. ${d.name}`,
        formatCurrency(d.value),
      ]);
      autoTable(doc, {
        startY: 28,
        head: [['Categoria', 'Valor']],
        body: chartRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });
    }

    doc.save(`${filename}.pdf`);
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const metricLabel = metrics.find((m) => m.id === selectedMetric)?.label || 'relatorio';
    const filename = `relatorio_${metricLabel.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

    if (exportFormat === 'csv') {
      exportCSV(filename);
    } else if (exportFormat === 'xlsx') {
      exportXLSX(filename);
    } else if (exportFormat === 'pdf') {
      exportPDF(filename);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Customizáveis</h1>
        <p className="text-muted-foreground">Crie e exporte relatórios personalizados</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Métrica</label>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-full">
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

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full">
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

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Formato</label>
          <Select
            value={exportFormat}
            onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf' | 'xlsx')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={tableData.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {summary && !isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(summary.netResult)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <FileBarChart className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.transactionCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <CardContent>
              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-muted-foreground flex h-[400px] items-center justify-center">
                  <div className="text-center">
                    <FileBarChart className="mx-auto mb-4 h-16 w-16 opacity-50" />
                    <p>Nenhum dado disponível para o período selecionado</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sortedChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" name="Valor">
                          {sortedChartData.map((_entry, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sortedChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ name, percent }: any) =>
                            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                        >
                          {sortedChartData.map((_entry, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Dados</CardTitle>
              <CardDescription>{tableData.length} registro(s) encontrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-muted h-8 animate-pulse rounded" />
                  ))}
                </div>
              ) : tableData.length === 0 ? (
                <div className="text-muted-foreground flex h-[200px] items-center justify-center">
                  Nenhum dado disponível
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedChartData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="flex items-center gap-2 font-medium">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            {row.name}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                          <TableCell className="text-right">
                            {(
                              (row.value /
                                (sortedChartData.reduce((s, d) => s + d.value, 0) || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
