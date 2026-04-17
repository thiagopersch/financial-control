import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    balance: number;
    pendingToPay: number;
  };
  isFullYear?: boolean;
}

export function StatsCards({ stats, isFullYear }: StatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getBalanceColors = (val: number) => {
    if (val < 0) return { color: "text-rose-600", bg: "bg-rose-100" };
    return { color: "text-emerald-600", bg: "bg-emerald-100" };
  };

  const cards = [
    {
      title: "Patrimônio Total",
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Soma de todas as contas",
    },
    {
      title: "Total Receitas",
      value: formatCurrency(stats.totalIncome),
      icon: ArrowUpCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      description: isFullYear ? "Este ano" : "Este mês",
    },
    {
      title: "Total Despesas",
      value: formatCurrency(stats.totalExpense),
      icon: ArrowDownCircle,
      color: "text-rose-600",
      bg: "bg-rose-100",
      description: isFullYear ? "Este ano" : "Este mês",
    },
    {
      title: "Resultado Líquido",
      value: formatCurrency(stats.balance),
      icon: stats.balance >= 0 ? ArrowUpCircle : ArrowDownCircle,
      color: stats.balance >= 0 ? "text-emerald-600" : "text-rose-600",
      bg: stats.balance >= 0 ? "bg-emerald-100" : "bg-rose-100",
      description: "Receitas - Despesas",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <p className="text-muted-foreground mt-1 text-xs">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
