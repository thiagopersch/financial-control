'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuditLogs, type AuditLog } from '@/lib/queries/audit';
import {
  Calendar,
  ScrollText,
  Search,
  Trash2,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

const actionLabels: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  LOGIN: 'Login',
};

const entityLabels: Record<string, string> = {
  Account: 'Conta',
  Transaction: 'Transação',
  Category: 'Categoria',
  Debt: 'Dívida',
  Budget: 'Orçamento',
  User: 'Usuário',
  CreditCard: 'Cartão de Crédito',
  CostCenter: 'Centro de Custo',
  Supplier: 'Fornecedor',
  Goal: 'Meta',
  ConditionalRule: 'Regra de Automação',
};

const fieldLabels: Record<string, string> = {
  id: 'ID',
  name: 'Nome',
  email: 'E-mail',
  amount: 'Valor',
  type: 'Tipo',
  status: 'Status',
  description: 'Descrição',
  categoryId: 'Categoria',
  accountId: 'Conta',
  costCenterId: 'Centro de Custo',
  supplierId: 'Fornecedor',
  notes: 'Observações',
  color: 'Cor',
  limit: 'Limite',
  closingDay: 'Dia Fechamento',
  dueDay: 'Dia Vencimento',
  initialBalance: 'Saldo Inicial',
  initialValue: 'Valor Inicial',
  currentValue: 'Valor Atual',
  interestRate: 'Taxa de Juros',
  minimumPayment: 'Pagamento Mínimo',
  installments: 'Parcelas',
  calculationType: 'Tipo de Cálculo',
  installmentValue: 'Valor Parcela',
  firstInstallmentMonth: 'Primeira Parcela',
  dueDate: 'Data Vencimento',
  date: 'Data',
  isActive: 'Ativo',
  isRecurring: 'Recorrente',
  recurrenceType: 'Tipo Recorrência',
  targetAmount: 'Valor Alvo',
  currentAmount: 'Valor Atual',
  deadline: 'Prazo',
  role: 'Função',
  password: 'Senha',
  keyword: 'Palavra-chave',
  bio: 'Bio',
  fromAccountId: 'Conta Origem',
  toAccountId: 'Conta Destino',
  isPaid: 'Pago',
  paidAt: 'Data Pagamento',
  createdAt: 'Criado em',
  updatedAt: 'Atualizado em',
  workspaceId: 'Workspace',
  parentTransactionId: 'Transação Pai',
};

function formatLabel(key: string): string {
  return (
    fieldLabels[key] ||
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim()
  );
}

function formatFieldValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (
    key === 'amount' ||
    key === 'currentValue' ||
    key === 'initialValue' ||
    key === 'targetAmount' ||
    key === 'currentAmount' ||
    key === 'installmentValue' ||
    key === 'minimumPayment' ||
    key === 'interestRate' ||
    key === 'limit' ||
    key === 'initialBalance'
  ) {
    const num = Number(val);
    if (!isNaN(num)) {
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
  }
  if (
    key === 'date' ||
    key === 'dueDate' ||
    key === 'createdAt' ||
    key === 'updatedAt' ||
    key === 'deadline' ||
    key === 'startDate'
  ) {
    const d = new Date(val as string);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('pt-BR');
    }
  }
  if (key === 'type') {
    if (val === 'INCOME') return 'Receita';
    if (val === 'EXPENSE') return 'Despesa';
  }
  if (key === 'status') {
    if (val === 'PAID') return 'Pago';
    if (val === 'PENDING') return 'Pendente';
    if (val === 'OVERDUE') return 'Atrasado';
  }
  if (key === 'calculationType') {
    if (val === 'TOTAL_DIVIDED') return 'Dividir Total';
    if (val === 'FIXED_INSTALLMENT') return 'Valor Fixo';
  }
  if (key === 'firstInstallmentMonth') {
    if (val === 'CURRENT') return 'Este Mês';
    if (val === 'NEXT') return 'Próximo Mês';
  }
  if (key === 'frequency') {
    if (val === 'DAILY') return 'Diário';
    if (val === 'WEEKLY') return 'Semanal';
    if (val === 'MONTHLY') return 'Mensal';
    if (val === 'BUSINESS_DAYS') return 'Dias Úteis';
  }
  if (key === 'recurrenceType') {
    if (val === 'CONTINUOUS') return 'Contínua';
    if (val === 'INSTALLMENTS') return 'Parcelada';
  }
  if (key === 'role') {
    if (val === 'ADMIN') return 'Administrador';
    if (val === 'MANAGER') return 'Gerente';
    if (val === 'VIEWER') return 'Visualizador';
  }
  return String(val);
}

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { logs, isLoading } = useAuditLogs({
    entity: filterEntity,
    action: filterAction,
  });

  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity))], [logs]);
  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);

  const filteredLogs = logs.filter((log) =>
    search
      ? log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        log.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.user.email.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE'))
      return <Badge className="bg-emerald-500/90 hover:bg-emerald-500">Criação</Badge>;
    if (action.includes('UPDATE'))
      return <Badge className="bg-blue-500/90 hover:bg-blue-500">Atualização</Badge>;
    if (action.includes('DELETE'))
      return <Badge className="bg-red-500/90 hover:bg-red-500">Exclusão</Badge>;
    if (action.includes('LOGIN'))
      return <Badge className="bg-purple-500/90 hover:bg-purple-500">Login</Badge>;
    return <Badge>Outros</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Log de Auditoria</h1>
        <p className="text-muted-foreground">Histórico de todas as ações realizadas no sistema</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Buscar por ação, entidade ou usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {entityLabels[e] || e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {actionLabels[a] || a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <ScrollText className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Nenhum registro</h3>
          <p className="text-muted-foreground mt-2 text-center">
            Não foram encontradas ações com os filtros selecionados
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-[180px]">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="font-medium">
                    {entityLabels[log.entity] || log.entity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.user.name || log.user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Auditoria</DialogTitle>
            <DialogDescription>Informações completas do registro de auditoria</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[75vh] pr-4">
              <div className="space-y-6">
                {selectedLog.action === 'DELETE' && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700 dark:text-red-400">
                      Registro excluído
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Ação
                    </p>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Entidade
                    </p>
                    <p className="mt-1 font-medium">
                      {entityLabels[selectedLog.entity] || selectedLog.entity}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Usuário
                    </p>
                    <p className="mt-1 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {selectedLog.user.name || selectedLog.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Data
                    </p>
                    <p className="mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedLog.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {selectedLog.entityId && (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      ID do Registro
                    </p>
                    <p className="text-muted-foreground mt-1 font-mono text-xs">
                      {selectedLog.entityId}
                    </p>
                  </div>
                )}

                {(selectedLog.oldValue || selectedLog.newValue) && (
                  <div>
                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                      {selectedLog.action === 'UPDATE'
                        ? 'Alterações detectadas'
                        : selectedLog.action === 'DELETE'
                          ? 'Dados do registro excluído'
                          : 'Dados do registro'}
                    </p>
                    {selectedLog.action === 'UPDATE' &&
                    selectedLog.oldValue &&
                    selectedLog.newValue ? (
                      <DiffView oldValue={selectedLog.oldValue} newValue={selectedLog.newValue} />
                    ) : selectedLog.action === 'DELETE' && selectedLog.oldValue ? (
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/10">
                        <div className="space-y-1.5">
                          {formatDetailedEntries(selectedLog.oldValue)}
                        </div>
                      </div>
                    ) : selectedLog.newValue ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/10">
                        <div className="space-y-1.5">
                          {formatDetailedEntries(selectedLog.newValue)}
                        </div>
                      </div>
                    ) : selectedLog.oldValue ? (
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/10">
                        <div className="space-y-1.5">
                          {formatDetailedEntries(selectedLog.oldValue)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiffView({ oldValue, newValue }: { oldValue: any; newValue: any }) {
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    if (oldValue && typeof oldValue === 'object') {
      Object.keys(oldValue).forEach((k) => keys.add(k));
    }
    if (newValue && typeof newValue === 'object') {
      Object.keys(newValue).forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  }, [oldValue, newValue]);

  const changedKeys = useMemo(() => {
    const changed = new Set<string>();
    for (const key of allKeys) {
      if (String(oldValue?.[key] ?? '') !== String(newValue?.[key] ?? '')) {
        changed.add(key);
      }
    }
    return changed;
  }, [allKeys, oldValue, newValue]);

  const changedEntries = allKeys.filter((k) => changedKeys.has(k));
  const unchangedEntries = allKeys.filter((k) => !changedKeys.has(k));
  const [showUnchanged, setShowUnchanged] = useState(false);

  if (changedEntries.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/10">
        <div className="space-y-1.5">{formatDetailedEntries(newValue || oldValue)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Campo</TableHead>
              <TableHead className="w-1/2">
                <span className="flex items-center gap-1 text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Valor Anterior
                </span>
              </TableHead>
              <TableHead className="w-1/2">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Novo Valor
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changedEntries.map((key) => (
              <TableRow key={key} className="bg-red-50/30 dark:bg-red-950/5">
                <TableCell className="font-medium">{formatLabel(key)}</TableCell>
                <TableCell className="text-red-600 line-through decoration-2">
                  {formatFieldValue(key, oldValue?.[key])}
                </TableCell>
                <TableCell className="font-medium text-emerald-600">
                  {formatFieldValue(key, newValue?.[key])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {unchangedEntries.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnchanged(!showUnchanged)}
            className="text-muted-foreground flex items-center gap-1 text-xs font-medium hover:underline"
          >
            {showUnchanged ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {unchangedEntries.length} campo(s) não alterado(s)
          </button>
          {showUnchanged && (
            <div className="border-muted bg-muted/30 mt-2 rounded-lg border p-4">
              <div className="space-y-1.5">
                {unchangedEntries.map((key) => (
                  <div key={key} className="flex justify-between gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0">{formatLabel(key)}:</span>
                    <span className="text-right font-medium">
                      {formatFieldValue(key, newValue?.[key] ?? oldValue?.[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDetailedEntries(value: any): React.ReactNode {
  if (!value) return <span className="text-muted-foreground text-sm">-</span>;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-muted-foreground text-sm">-</span>;
    return entries.map(([key, val]) => {
      return (
        <div key={key} className="flex justify-between gap-2 text-sm">
          <span className="text-muted-foreground shrink-0">{formatLabel(key)}:</span>
          <span className="text-right font-medium">{formatFieldValue(key, val)}</span>
        </div>
      );
    });
  }
  return <span className="text-sm">{String(value)}</span>;
}
