import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, Category, Supplier, TransactionType, TransactionStatus } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: (Transaction & {
    category: Category;
    supplier: Supplier | null;
  })[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const statusMap = {
    [TransactionStatus.PAID]: { label: "Pago", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    [TransactionStatus.PENDING]: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    [TransactionStatus.OVERDUE]: { label: "Atrasado", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  };

  return (
    <Card className="col-span-full border-none shadow-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-none">
                <TableHead>Descrição/Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fornecedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b dark:border-slate-800 last:border-0">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          t.type === TransactionType.INCOME ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"
                        )}>
                          {t.type === TransactionType.INCOME ? (
                            <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{t.category.name}</div>
                          {t.notes && <div className="text-xs text-muted-foreground line-clamp-1">{t.notes}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(t.date), "dd 'de' MMM", { locale: ptBR })}
                    </TableCell>
                    <TableCell className={cn(
                      "font-bold text-sm",
                      t.type === TransactionType.INCOME ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {t.type === TransactionType.INCOME ? "+" : "-"} {formatCurrency(Number(t.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("border-none", statusMap[t.status].className)}>
                        {statusMap[t.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.supplier?.name || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
