'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useReconciliation } from '@/lib/queries/reconciliation';
import { formatCurrency } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/utils/toast';
import { AlertTriangle, Check, RefreshCw, Upload } from 'lucide-react';
import { useState } from 'react';

export default function ReconciliationPage() {
  const [isUploading, setIsUploading] = useState(false);
  const { transactions, stats, isLoading, refresh } = useReconciliation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/reconciliation/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showSuccess('Arquivo importado com sucesso');
        refresh();
      } else {
        const error = await response.json();
        showError(error.error || 'Erro ao importar arquivo');
      }
    } catch {
      showError('Erro ao importar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const matchPercentage = stats && stats.total > 0 ? (stats.matched / stats.total) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
          <p className="text-muted-foreground">
            Concilie suas transações bancárias com seus registros
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.ofx,.xlsx"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isUploading}
            />
            <Button disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
              <RefreshCw className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliadas</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.matched}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchPercentage.toFixed(1)}%</div>
              <Progress value={matchPercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="bg-muted h-6 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma transação para conciliar</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Importe um arquivo para começar a conciliação
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transações Bancárias</CardTitle>
            <CardDescription>Lista de transações importadas do extrato bancário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {tx.matched ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <Badge variant={tx.matched ? 'default' : 'secondary'}>
                      {tx.matched ? 'Conciliada' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
