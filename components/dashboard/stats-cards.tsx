import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodLoading } from '@/components/ui/loading-overlay';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    cardLimit: number;
    balance: number;
    pendingToPay: number;
  };
  isFullYear?: boolean;
}

const POSITIVE = { color: 'text-primary', bg: 'bg-primary/10' };
const NEGATIVE = { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/40' };

export function StatsCards({ stats, isFullYear }: StatsCardsProps) {
  const periodLabel = isFullYear ? 'Este ano' : 'Este mês';
  const cards = [
    {
      title: 'Patrimônio Total',
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      ...(stats.totalBalance >= 0 ? POSITIVE : NEGATIVE),
      description: 'Receitas + limite dos cartões − despesas pagas',
    },
    {
      title: 'Total Receitas',
      value: formatCurrency(stats.totalIncome),
      icon: ArrowUpCircle,
      ...POSITIVE,
      description:
        stats.cardLimit > 0
          ? `${periodLabel} · inclui ${formatCurrency(stats.cardLimit)} de limite de cartões`
          : periodLabel,
    },
    {
      title: 'Total Despesas',
      value: formatCurrency(stats.totalExpense),
      icon: ArrowDownCircle,
      ...NEGATIVE,
      description: periodLabel,
    },
    {
      title: 'Resultado Líquido',
      value: formatCurrency(stats.balance),
      icon: stats.balance >= 0 ? ArrowUpCircle : ArrowDownCircle,
      ...(stats.balance >= 0 ? POSITIVE : NEGATIVE),
      description: 'Receitas - Despesas',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <PeriodLoading key={card.title} size="sm" className="rounded-lg">
          <Card className="h-full overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-xl font-bold tabular-nums xl:text-2xl ${card.color}`}
                title={card.value}
              >
                {card.value}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{card.description}</p>
            </CardContent>
          </Card>
        </PeriodLoading>
      ))}
    </div>
  );
}
