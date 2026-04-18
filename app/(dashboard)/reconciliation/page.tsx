"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Upload, Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  matched: boolean;
}

interface ReconciliationStats {
  total: number;
  matched: number;
  pending: number;
  disputed: number;
}

export default function ReconciliationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reconciliation");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Error fetching reconciliation:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/reconciliation/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Arquivo importado com sucesso");
        fetchTransactions();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao importar arquivo");
      }
    } catch (error) {
      toast.error("Erro ao importar arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  const matchTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/reconciliation/${id}/match`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Transação conciliada");
        fetchTransactions();
      }
    } catch (error) {
      toast.error("Erro ao conciliação");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MATCHED":
        return <Badge className="bg-green-500">Conciliado</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "DISPUTED":
        return <Badge className="bg-red-500">Disputado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const matchPercentage = stats ? (stats.matched / stats.total) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
          <p className="text-muted-foreground">Importe e concilie transações bancárias</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              type="file"
              accept=".csv,.ofx"
              className="hidden"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" asChild disabled={isUploading}>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Importando..." : "Importar"}
                </span>
              </Button>
            </Label>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <RefreshCw className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliados</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
        <Card className="animate-pulse">
          <CardContent className="py-4">
            <div className="bg-muted h-20 rounded" />
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma transação</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Importe um arquivo CSV ou OFX para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
            <CardDescription>Lista de transações importadas do banco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tx.description}</span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {new Date(tx.date).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-bold ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </span>
                    {tx.status === "PENDING" && (
                      <Button size="sm" onClick={() => matchTransaction(tx.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
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
