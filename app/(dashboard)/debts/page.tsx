"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  MoreHorizontal,
  TrendingDown,
  Calculator,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Debt {
  id: string;
  name: string;
  description: string | null;
  initialValue: number;
  currentValue: number;
  interestRate: number | null;
  minimumPayment: number;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export default function DebtsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    months: number;
    totalInterest: number;
    totalPaid: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    initialValue: "",
    interestRate: "",
    minimumPayment: "",
    dueDay: "",
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/debts");
      if (response.ok) {
        const data = await response.json();
        setDebts(data.debts || []);
      }
    } catch (error) {
      console.error("Error fetching debts:", error);
      toast.error("Erro ao carregar dívidas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          initialValue: parseFloat(formData.initialValue),
          currentValue: parseFloat(formData.initialValue),
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
          minimumPayment: parseFloat(formData.minimumPayment),
          dueDay: formData.dueDay ? parseInt(formData.dueDay) : null,
          startDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Dívida criada com sucesso");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          initialValue: "",
          interestRate: "",
          minimumPayment: "",
          dueDay: "",
        });
        fetchDebts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar dívida");
      }
    } catch (error) {
      toast.error("Erro ao criar dívida");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta dívida?")) return;

    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Dívida excluída com sucesso");
        fetchDebts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir dívida");
      }
    } catch (error) {
      toast.error("Erro ao excluir dívida");
    }
  };

  const simulatePayment = (debt: Debt) => {
    if (!debt.interestRate || !debt.minimumPayment) {
      toast.error("Dados insuficientes para simulação");
      return;
    }

    let balance = debt.currentValue;
    const monthlyRate = debt.interestRate / 100 / 12;
    let months = 0;
    let totalInterest = 0;
    const totalPaid = debt.currentValue;

    while (balance > 0 && months < 120) {
      const interest = balance * monthlyRate;
      const principal = Math.max(debt.minimumPayment - interest, 0);
      balance -= principal;
      totalInterest += interest;
      months++;
    }

    setSimulationResult({
      months,
      totalInterest,
      totalPaid: totalPaid + totalInterest,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.currentValue, 0);
  const activeDebts = debts.filter((d) => d.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dívidas e Juros</h1>
          <p className="text-muted-foreground">Gerencie suas dívidas e simule pagamentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Dívida</DialogTitle>
              <DialogDescription>Cadastre uma nova dívida para控制和追踪</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Dívida</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Empréstimo BB, Fin Social"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialValue">Valor Inicial</Label>
                <Input
                  id="initialValue"
                  type="number"
                  step="0.01"
                  value={formData.initialValue}
                  onChange={(e) => setFormData({ ...formData, initialValue: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Taxa de Juros (% ao mês)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Pagamento Mínimo</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    step="0.01"
                    value={formData.minimumPayment}
                    onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de Vencimento</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay}
                  onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                  placeholder="Ex: 15"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Dívida"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dívidas Ativas</CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDebts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Juros</CardTitle>
            <Calculator className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {debts.length > 0
                ? (
                    debts.reduce((sum, d) => sum + (d.interestRate || 0), 0) /
                      debts.filter((d) => d.interestRate).length || 0
                  ).toFixed(2)
                : "0"}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="bg-muted h-6 w-32 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-20 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : debts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma dívida cadastrada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Cadastre suas dívidas para gerenciar e simular pagamentos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debts.map((debt) => {
            const progress =
              debt.initialValue > 0
                ? ((debt.initialValue - debt.currentValue) / debt.initialValue) * 100
                : 0;

            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => simulatePayment(debt)}>
                        Simular Pagamento
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(debt.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  {debt.description && (
                    <p className="text-muted-foreground text-sm">{debt.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Valor Inicial</p>
                      <p className="font-medium">{formatCurrency(debt.initialValue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Valor Atual</p>
                      <p className="font-bold text-red-600">{formatCurrency(debt.currentValue)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="flex gap-4 text-sm">
                    {debt.interestRate && (
                      <span className="text-muted-foreground">Juros: {debt.interestRate}%</span>
                    )}
                    {debt.minimumPayment && (
                      <span className="text-muted-foreground">
                        Mín: {formatCurrency(debt.minimumPayment)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {simulationResult && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle>Resultado da Simulação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tempo para quitar:</span>
              <span className="font-bold">{simulationResult.months} meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de juros:</span>
              <span className="font-bold text-red-600">
                {formatCurrency(simulationResult.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total a pagar:</span>
              <span className="font-bold">{formatCurrency(simulationResult.totalPaid)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
