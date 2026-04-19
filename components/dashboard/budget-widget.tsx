"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { deleteBudget } from "@/lib/actions/budgets";
import { cn, formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

function getMonthName(month: number): string {
  return monthNames[month - 1] || "";
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetData {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertAt80: boolean;
  alertAt100: boolean;
  category: Category;
  spent?: number;
  percent?: number;
}

interface BudgetCardProps {
  budget: BudgetData;
  showPeriod?: boolean;
  onEdit?: (budget: BudgetData) => void;
  onDelete?: (budgetId: string) => void;
  onSuccess?: () => void;
}

function BudgetCard({ budget, showPeriod = false, onEdit, onDelete, onSuccess }: BudgetCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isOver = budget.percent !== undefined && budget.percent >= 100;
  const isWarning = budget.percent !== undefined && budget.percent >= 80 && budget.percent < 100;

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const result = await deleteBudget(budget.id);
    if (result.success) {
      toast.success("Orçamento excluído com sucesso", {
        position: "bottom-center",
        richColors: true,
      });
      onSuccess?.();
    } else {
      toast.error(result.error || "Erro ao excluir orçamento", {
        position: "bottom-center",
        richColors: true,
      });
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <Card className="from-background to-muted/20 bg-linear-to-br">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: budget.category?.color }}
              />
              <CardTitle className="text-base">{budget.category?.name}</CardTitle>
            </div>
            {showPeriod && (
              <span className="text-xs text-muted-foreground">
                {getMonthName(budget.month)}/{budget.year}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(budget)} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick} className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gasto</span>
              <span className="font-medium">{formatCurrency(budget.spent || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Orçamento</span>
              <span className="font-medium">{formatCurrency(budget.amount)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Progress
              value={Math.min(budget.percent || 0, 100)}
              className={cn(
                "h-2",
                isOver
                  ? "[&>div]:bg-rose-500"
                  : isWarning
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-emerald-500",
              )}
            />
            <div className="flex items-center justify-between text-xs font-bold tracking-tight uppercase">
              <span
                className={cn(
                  isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-emerald-600",
                )}
              >
                {budget.percent?.toFixed(0) || 0}%
              </span>
              {isOver ? (
                <span className="flex items-center gap-1 text-rose-600">
                  <AlertCircle size={10} /> Estourado
                </span>
              ) : isWarning ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle size={10} /> Alerta
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 size={10} /> Ok
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Orçamento"
        description={`Tem certeza que deseja excluir o orçamento de "${budget.category?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </>
  );
}

export function BudgetWidget({ budgets, onEdit, onSuccess, showPeriod = false }: { budgets: BudgetData[]; onEdit?: (budget: BudgetData) => void; onSuccess?: () => void; showPeriod?: boolean }) {
  if (budgets.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Orçamentos</CardTitle>
          <CardDescription>Acompanhe seus limites por categoria.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-muted mb-3 rounded-full p-3">
            <AlertCircle className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhum orçamento definido para este período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          showPeriod={showPeriod}
          onEdit={onEdit}
          onSuccess={onSuccess}
        />
      ))}
    </div>
  );
}