"use client";

import { useState } from "react";
import { AlertTriangle, Plus, MoreHorizontal, TrendingDown, Calculator } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useDebts, type Debt } from "@/lib/queries/debts";
import { createDebt, deleteDebt } from "@/lib/actions/debts";

export default function DebtsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    months: number;
    totalInterest: number;
    totalPaid: number;
  } | null>(null);

  const { debts, isLoading, refresh } = useDebts();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    initialValue: "",
    interestRate: "",
    minimumPayment: "",
    dueDay: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createDebt({
        name: formData.name,
        description: formData.description || undefined,
        initialValue: parseFloat(formData.initialValue),
        currentValue: parseFloat(formData.initialValue),
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        minimumPayment: parseFloat(formData.minimumPayment),
        dueDay: formData.dueDay ? parseInt(formData.dueDay) : undefined,
        startDate: new Date().toISOString(),
      });

      if (result.success) {
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
        refresh();
      } else {
        toast.error(result.error || "Erro ao criar dívida");
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
      const result = await deleteDebt(id);
      if (result.success) {
        toast.success("Dívida excluída com sucesso");
        refresh();
      }
    } catch (error) {
      toast.error("Erro ao excluir dívida");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const activeDebts = debts.filter((d) => d.isActive);
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentValue, 0);
  const totalInitial = activeDebts.reduce((sum, d) => sum + d.initialValue, 0);
  const paidPercentage = totalInitial > 0 ? ((totalInitial - totalDebt) / totalInitial) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dívidas e Financiamentos</h1>
          <p className="text-muted-foreground">Gerencie suas dívidas e simule quitação</p>
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
              <DialogDescription>Adicione uma nova dívida ou financiamento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Empréstimo do banco"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialValue">Valor Total</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
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
                  <Label htmlFor="dueDay">Dia de Vencimento</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    placeholder="1-31"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Dívida"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDebts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Pago</CardTitle>
            <Calculator className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInitial - totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidPercentage.toFixed(1)}%</div>
            <Progress value={paidPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

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
      ) : debts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma dívida cadastrada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Adicione suas dívidas para управлять它们的还款计划
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debts.map((debt) => {
            const debtPaid = debt.initialValue - debt.currentValue;
            const debtPercentage = (debtPaid / debt.initialValue) * 100;

            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`h-5 w-5 ${debt.isActive ? "text-red-500" : "text-gray-400"}`}
                    />
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                    <Badge variant={debt.isActive ? "default" : "secondary"}>
                      {debt.isActive ? "Ativa" : "Quitada"}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(debt.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Original:</span>
                      <span className="font-medium">{formatCurrency(debt.initialValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Atual:</span>
                      <span className="font-medium text-red-500">
                        {formatCurrency(debt.currentValue)}
                      </span>
                    </div>
                    {debt.interestRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Juros:</span>
                        <span className="font-medium">{debt.interestRate}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pagamento Mínimo:</span>
                      <span className="font-medium">{formatCurrency(debt.minimumPayment)}</span>
                    </div>
                    <Progress value={debtPercentage} className="mt-2" />
                    <p className="text-muted-foreground text-right text-xs">
                      {debtPercentage.toFixed(1)} pago
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
