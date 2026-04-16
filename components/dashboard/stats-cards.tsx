import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Ban, Wallet } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalIncome: number;
    totalExpense: number;
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

  const getBalanceColors = () => {
    if (stats.balance < 0) return { color: "text-rose-600", bg: "bg-rose-100" };
    if (stats.totalIncome === 0) return { color: "text-indigo-600", bg: "bg-indigo-100" };

    const ratio = stats.totalExpense / stats.totalIncome;

    if (ratio > 0.9) return { color: "text-amber-600", bg: "bg-amber-100" }; // Muito próximos
    if (ratio > 0.7) return { color: "text-blue-600", bg: "bg-blue-100" }; // Um pouco mais longe
    return { color: "text-emerald-600", bg: "bg-emerald-100" }; // Valores positivos / Saudável
  };

  const balanceColors = getBalanceColors();

  const cards = [
    {
      title: "Saldo Atual",
      value: formatCurrency(stats.balance),
      icon: Wallet,
      color: balanceColors.color,
      bg: balanceColors.bg,
    },
    {
      title: "Total Receitas",
      value: formatCurrency(stats.totalIncome),
      icon: ArrowUpCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Total Despesas",
      value: formatCurrency(stats.totalExpense),
      icon: ArrowDownCircle,
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
    {
      title: "A Vencer",
      value: formatCurrency(stats.pendingToPay),
      icon: Ban,
      color: "text-amber-600",
      bg: "bg-amber-100",
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
            <p className="text-muted-foreground mt-1 text-xs">
              {isFullYear ? "Este ano" : "Este mês"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
