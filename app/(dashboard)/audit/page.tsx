"use client";

import { useState, useEffect } from "react";
import { ScrollText, Search, Filter, User, Calendar, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AuditPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [filterEntity, filterAction]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterEntity !== "all") params.set("entity", filterEntity);
      if (filterAction !== "all") params.set("action", filterAction);

      const response = await fetch(`/api/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) return <Badge className="bg-green-500">Criação</Badge>;
    if (action.includes("UPDATE")) return <Badge className="bg-blue-500">Atualização</Badge>;
    if (action.includes("DELETE")) return <Badge className="bg-red-500">Exclusão</Badge>;
    if (action.includes("LOGIN")) return <Badge className="bg-purple-500">Login</Badge>;
    return <Badge>Outros</Badge>;
  };

  const filteredLogs = logs.filter((log) =>
    search
      ? log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        log.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.user.email.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const entities = [...new Set(logs.map((l) => l.entity))];
  const actions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Log de Auditoria</h1>
        <p className="text-muted-foreground">Histórico de todas as ações realizadas no sistema</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Buscar por ação, entidade ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="bg-muted mb-2 h-4 w-1/4 rounded" />
                <div className="bg-muted h-3 w-1/2 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ScrollText className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum registro</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Não foram encontradas ações com os filtros selecionados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground">em</span>
                      <span className="font-medium">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-muted-foreground text-sm">
                          ({log.entityId.slice(0, 8)}...)
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{log.user.name || log.user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                    {(log.oldValue || log.newValue) && (
                      <div className="text-muted-foreground mt-2 text-xs">
                        {log.oldValue && (
                          <span className="mr-4">
                            Antes:{" "}
                            {typeof log.oldValue === "object"
                              ? JSON.stringify(log.oldValue)
                              : log.oldValue}
                          </span>
                        )}
                        {log.newValue && (
                          <span>
                            Depois:{" "}
                            {typeof log.newValue === "object"
                              ? JSON.stringify(log.newValue)
                              : log.newValue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
