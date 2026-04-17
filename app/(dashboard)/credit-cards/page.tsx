"use client";

import { useState } from "react";
import { CreditCard, Plus, MoreHorizontal, DollarSign, Calendar, AlertCircle } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface CreditCardData {
  id: string;
  name: string;
  limit: number;
  usedAmount: number;
  availableLimit: number;
  usagePercentage: number;
  closingDay: number;
  dueDay: number;
  color: string;
  account: Account;
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  month: number;
  year: number;
  amount: number;
  dueDate: string | null;
  status: string;
}

interface AccountsData {
  accounts: Account[];
}

export default function CreditCardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    limit: "",
    closingDay: "",
    dueDay: "",
    accountId: "",
    color: "#6366f1",
  });

  useState(() => {
    fetchData();
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cardsRes, accountsRes] = await Promise.all([
        fetch("/api/credit-cards"),
        fetch("/api/accounts"),
      ]);

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCreditCards(cardsData.creditCards || []);
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          limit: parseFloat(formData.limit),
          closingDay: parseInt(formData.closingDay),
          dueDay: parseInt(formData.dueDay),
          accountId: formData.accountId,
          color: formData.color,
        }),
      });

      if (response.ok) {
        toast.success("Cartão de crédito criado com sucesso");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          limit: "",
          closingDay: "",
          dueDay: "",
          accountId: "",
          color: "#6366f1",
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar cartão");
      }
    } catch (error) {
      toast.error("Erro ao criar cartão de crédito");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cartão?")) return;

    try {
      const response = await fetch(`/api/credit-cards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Cartão excluído com sucesso");
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir cartão");
      }
    } catch (error) {
      toast.error("Erro ao excluir cartão");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-yellow-500">Aberta</Badge>;
      case "CLOSED":
        return <Badge className="bg-blue-500">Fechada</Badge>;
      case "PAID":
        return <Badge className="bg-green-500">Paga</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-muted-foreground">Gerencie seus cartões de crédito e faturas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cartão de Crédito</DialogTitle>
              <DialogDescription>
                Cadastre um novo cartão de crédito para gerenciar suas compras
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cartão</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Nubank, Itaú"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Limite</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closingDay">Dia do Fechamento</Label>
                  <Input
                    id="closingDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closingDay}
                    onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Dia do Vencimento</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountId">Conta Vinculada</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-full"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Cartão"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="bg-muted h-6 w-32 rounded" />
                <div className="bg-muted mt-2 h-4 w-24 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-20 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : creditCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum cartão cadastrado</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Cadastre seu primeiro cartão de crédito para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map((card) => (
            <Card key={card.id} style={{ borderTopColor: card.color, borderTopWidth: 4 }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" style={{ color: card.color }} />
                  <CardTitle className="text-lg">{card.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDelete(card.id)}
                      className="text-red-600"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limite Utilizado</span>
                    <span className="font-medium">{card.usagePercentage.toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={card.usagePercentage}
                    className={`h-2 ${getUsageColor(card.usagePercentage)}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Limite</p>
                    <p className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {card.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Disponível</p>
                    <p className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {card.availableLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Fechamento: dia {card.closingDay}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Vencimento: dia {card.dueDay}</span>
                  </div>
                </div>
                {card.invoices.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="mb-2 text-sm font-medium">Faturas Recentes</p>
                    <div className="space-y-2">
                      {card.invoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between text-sm">
                          <span>
                            {invoice.month}/{invoice.year}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              R${" "}
                              {Number(invoice.amount).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
