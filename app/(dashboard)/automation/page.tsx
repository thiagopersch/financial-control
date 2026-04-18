"use client";

import { useState, useEffect } from "react";
import { GitBranch, Plus, MoreHorizontal, Zap, ToggleLeft, ToggleRight, Play } from "lucide-react";
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

interface ConditionalRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: any;
  actions: any;
}

const conditionOptions = [
  { value: "AMOUNT_GREATER", label: "Valor maior que" },
  { value: "AMOUNT_LESS", label: "Valor menor que" },
  { value: "AMOUNT_EQUAL", label: "Valor igual a" },
  { value: "CATEGORY_IS", label: "Categoria é" },
  { value: "TAG_IS", label: "Tag é" },
  { value: "CONTAINS", label: "Descrição contém" },
];

const actionOptions = [
  { value: "ADD_TAG", label: "Adicionar tag" },
  { value: "ADD_CATEGORY", label: "Mudar categoria" },
  { value: "SET_STATUS", label: "Alterar status" },
  { value: "NOTIFY", label: "Enviar notificação" },
];

export default function AutomationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rules, setRules] = useState<ConditionalRule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    conditionType: "",
    conditionValue: "",
    actionType: "",
    actionValue: "",
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/conditional-rules");
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Erro ao carregar regras");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const conditions = [
        {
          type: formData.conditionType,
          value: formData.conditionValue,
        },
      ];

      const actions = [
        {
          type: formData.actionType,
          value: formData.actionValue,
        },
      ];

      const response = await fetch("/api/conditional-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          conditions,
          actions,
        }),
      });

      if (response.ok) {
        toast.success("Regra criada com sucesso");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          conditionType: "",
          conditionValue: "",
          actionType: "",
          actionValue: "",
        });
        fetchRules();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar regra");
      }
    } catch (error) {
      toast.error("Erro ao criar regra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/conditional-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(isActive ? "Regra desativada" : "Regra ativada");
        fetchRules();
      }
    } catch (error) {
      toast.error("Erro ao atualizar regra");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;

    try {
      const response = await fetch(`/api/conditional-rules/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Regra excluída com sucesso");
        fetchRules();
      }
    } catch (error) {
      toast.error("Erro ao excluir regra");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação</h1>
          <p className="text-muted-foreground">Crie regras condicionais para automatizar ações</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra de Automação</DialogTitle>
              <DialogDescription>
                Configure quando a regra deve ser ativada e o que fazer
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Tag despesas básicas"
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
                <Label>Condição</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.conditionType}
                    onValueChange={(value) => setFormData({ ...formData, conditionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de condição" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.conditionValue}
                    onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                    placeholder="Valor ou categoria"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ação</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de ação" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.actionValue}
                    onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                    placeholder="Valor da ação"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Regra"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma regra criada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Crie regras de automação para facilitar seu dia a dia
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Zap
                    className={`h-5 w-5 ${rule.isActive ? "text-yellow-500" : "text-gray-400"}`}
                  />
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id, rule.isActive)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {rule.description && (
                  <p className="text-muted-foreground mb-2 text-sm">{rule.description}</p>
                )}
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Condição: {JSON.parse(JSON.stringify(rule.conditions))[0]?.type || "N/A"}
                  </span>
                  <span className="text-muted-foreground">
                    Ação: {JSON.parse(JSON.stringify(rule.actions))[0]?.type || "N/A"}
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
