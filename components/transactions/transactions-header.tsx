"use client";

import { Button } from "@/components/ui/button";

import { MonthSelector } from "@/components/month-selector";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionStatus } from "@prisma/client";
import { format, parse } from "date-fns";
import { ArrowRightLeft, Download, Plus, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TransactionModal } from "./transaction-modal";
import { TransferModal } from "./transfer-modal";

interface TransactionsHeaderProps {
  categories: { id: string; name: string; type: string; color: string }[];
  suppliers: any[];
  accounts: any[];
  availableRange?: {
    minDate: Date | string | null;
    maxDate: Date | string | null;
  };
  userRole?: string;
}

export function TransactionsHeader({
  categories,
  suppliers,
  accounts,
  availableRange,
  userRole,
}: TransactionsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = userRole && userRole !== "VIEWER";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
      if (key === "from" || key === "to") {
        params.delete("month");
      }
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete("q");
    } else {
      params.set("q", value);
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push(window.location.pathname);
  };

  const exportCSV = () => {
    const params = new URLSearchParams(searchParams);
    const url = `/api/transactions/export?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Exportação iniciada!", { description: "O download do CSV foi iniciado." });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight max-md:text-2xl">
            Transações
          </h1>
          <p className="text-muted-foreground max-md:text-sm">
            Monitore e gerencie todas as suas entradas e saídas.
          </p>
        </div>
        <div className="flex flex-col gap-2 max-md:flex-col-reverse max-md:gap-3 sm:items-center md:flex-row">
          {isEditing && (
            <>
              <Button variant="outline" size="lg" onClick={exportCSV} className="w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsTransferModalOpen(true)}
                className="w-full transition-all sm:w-auto"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transferir
              </Button>

              <Button
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="w-full transition-all sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Buscar por descrição, categoria ou fornecedor..."
            className="pl-8"
            defaultValue={searchParams.get("q") || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(e.currentTarget.value);
              }
            }}
          />
        </div>
      </div>

      <div className="dark:bg-accent dark:text-accent-foreground text-foreground grid grid-cols-1 items-end gap-4 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-4 lg:grid-cols-7">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">
            Mês de Referência
          </span>
          <MonthSelector availableRange={availableRange} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Início</span>
          <DatePicker
            date={
              searchParams.get("from")
                ? parse(searchParams.get("from")!, "yyyy-MM-dd", new Date())
                : undefined
            }
            setDate={(date) => {
              if (date) {
                handleFilterChange("from", format(date, "yyyy-MM-dd"));
              } else {
                handleFilterChange("from", "all");
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Fim</span>
          <DatePicker
            date={
              searchParams.get("to")
                ? parse(searchParams.get("to")!, "yyyy-MM-dd", new Date())
                : undefined
            }
            setDate={(date) => {
              if (date) {
                handleFilterChange("to", format(date, "yyyy-MM-dd"));
              } else {
                handleFilterChange("to", "all");
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Tipo</span>
          <Select
            onValueChange={(v) => handleFilterChange("type", v)}
            defaultValue={searchParams.get("type") || "all"}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="INCOME">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Receitas
                </div>
              </SelectItem>
              <SelectItem value="EXPENSE">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Despesas
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Status</span>
          <Select
            onValueChange={(v) => handleFilterChange("status", v)}
            defaultValue={searchParams.get("status") || "all"}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value={TransactionStatus.PAID}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Pago
                </div>
              </SelectItem>
              <SelectItem value={TransactionStatus.PENDING}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Pendente
                </div>
              </SelectItem>
              <SelectItem value={TransactionStatus.OVERDUE}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Atrasado
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">
            Categoria
          </span>
          <Select
            onValueChange={(v) => handleFilterChange("category", v)}
            defaultValue={searchParams.get("category") || "all"}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Conta</span>
          <Select
            onValueChange={(v) => handleFilterChange("account", v)}
            defaultValue={searchParams.get("account") || "all"}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {searchParams.toString() && (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="w-full border-2 border-dashed font-medium text-red-500 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed dark:hover:border-red-500 dark:hover:bg-red-500/10"
              disabled={!searchParams.toString()}
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}
