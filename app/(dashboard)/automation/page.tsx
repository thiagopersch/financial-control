"use client";

import { useState } from "react";
import { GitBranch, Plus, MoreHorizontal, Zap, Play, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useConditionalRules, type ConditionalRule } from "@/lib/queries/automation";
import {
  createConditionalRule,
  deleteConditionalRule,
  toggleConditionalRule,
} from "@/lib/actions/conditional-rules";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { rules, isLoading, refresh } = useConditionalRules();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    conditionType: "",
    conditionValue: "",
    actionType: "",
    actionValue: "",
  });

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

      const result = await createConditionalRule({
        name: formData.name,
        description: formData.description || undefined,
        conditions,
        actions,
        priority: 0,
        isActive: true,
      });

      if (result.success) {
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
        refresh();
      } else {
        toast.error(result.error || "Erro ao criar regra");
      }
    } catch (error) {
      toast.error("Erro ao criar regra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const result = await toggleConditionalRule(id, !isActive);
      if (result.success) {
        toast.success(isActive ? "Regra desativada" : "Regra ativada");
        refresh();
      }
    } catch (error) {
      toast.error("Erro ao atualizar regra");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;

    try {
      const result = await deleteConditionalRule(id);
      if (result.success) {
        toast.success("Regra excluída com sucesso");
        refresh();
      }
    } catch (error) {
      toast.error("Erro ao excluir regra");
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação</h1>
          <p className="text-muted-foreground">Crie regras condicionais para automatizar tarefas</p>
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
                Configure condições e ações para automatizar transações
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex:标记外卖为餐饮"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da regra"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condição</Label>
                  <Select
                    value={formData.conditionType}
                    onValueChange={(value) => setFormData({ ...formData, conditionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditionValue">Valor</Label>
                  <Input
                    id="conditionValue"
                    value={formData.conditionValue}
                    onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                    placeholder="Valor da condição"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionValue">Parâmetro</Label>
                  <Input
                    id="actionValue"
                    value={formData.actionValue}
                    onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                    placeholder="Parâmetro da ação"
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <GitBranch className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <Play className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length - activeCount}</div>
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
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhuma regra criada</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Crie regras para automatizar suas transações
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
                <p className="text-muted-foreground text-sm">
                  {rule.description || "Sem descrição"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
