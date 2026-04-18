"use client";

import { useState, useEffect } from "react";
import { CalendarClock, Plus, MoreHorizontal, Play, Pause, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ScheduledTransaction {
  id: string;
  name: string;
  type: string;
  amount: number;
  frequency: string;
  nextRun: string;
  isActive: boolean;
  category: { name: string };
}

export default function ScheduledPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduled, setScheduled] = useState<ScheduledTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    type: "EXPENSE",
    amount: "",
    frequency: "MONTHLY",
    dayOfMonth: "1",
    categoryId: "",
  });

  useEffect(() => {
    fetchScheduled();
    fetchCategories();
  }, []);

  const fetchScheduled = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scheduled-transactions");
      if (response.ok) {
        const data = await response.json();
        setScheduled(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching scheduled:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const nextRun = new Date();
      if (formData.frequency === "MONTHLY") {
        nextRun.setDate(parseInt(formData.dayOfMonth));
        if (nextRun < new Date()) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }

      const response = await fetch("/api/scheduled-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
          dayOfMonth: parseInt(formData.dayOfMonth),
          categoryId: formData.categoryId,
          nextRun: nextRun.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Agendamento criado com sucesso");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          type: "EXPENSE",
          amount: "",
          frequency: "MONTHLY",
          dayOfMonth: "1",
          categoryId: "",
        });
        fetchScheduled();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      toast.error("Erro ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/scheduled-transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(currentStatus ? "Agendamento pausado" : "Agendamento ativado");
        fetchScheduled();
      }
    } catch (error) {
      toast.error("Erro ao atualizar agendamento");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

    try {
      const response = await fetch(`/api/scheduled-transactions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Agendamento excluído com sucesso");
        fetchScheduled();
      }
    } catch (error) {
      toast.error("Erro ao excluir agendamento");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const frequencyLabels: Record<string, string> = {
    DAILY: "Diário",
    WEEKLY: "Semanal",
    MONTHLY: "Mensal",
    BUSINESS_DAYS: "Dias úteis",
    CUSTOM: "Personalizado",
  };

  const activeCount = scheduled.filter((s) => s.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações Agendadas</h1>
          <p className="text-muted-foreground">Gerencie transações recorrentes e agendadas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>Configure uma transação recorrente ou agendada</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aluguel, Salário"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Receita</SelectItem>
                      <SelectItem value="EXPENSE">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="BUSINESS_DAYS">Dias úteis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Dia do mês</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Agendamento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
            <CalendarClock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduled.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Pause className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduled.length - activeCount}</div>
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
      ) : scheduled.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarClock className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum agendamento</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Crie agendamentos para transações recorrentes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scheduled.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CalendarClock
                    className={`h-5 w-5 ${item.isActive ? "text-blue-500" : "text-gray-400"}`}
                  />
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={() => toggleActive(item.id, item.isActive)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <span
                    className="font-medium text-green-600"
                    style={item.type === "INCOME" ? {} : { color: "red" }}
                  >
                    {item.type === "INCOME" ? "+" : "-"} {formatCurrency(item.amount)}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    {frequencyLabels[item.frequency] || item.frequency}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    Próxima: {new Date(item.nextRun).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
