import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodLoading } from '@/components/ui/loading-overlay';
import { formatCurrency } from '@/lib/utils';
import Box from '@mui/material/Box';
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

/** Papel do tema usado pelo card: `income` quando o valor é positivo, `expense` quando negativo. */
type Tone = 'income' | 'expense';

export function StatsCards({ stats, isFullYear }: StatsCardsProps) {
  const periodLabel = isFullYear ? 'Este ano' : 'Este mês';
  const cards: {
    title: string;
    value: string;
    icon: typeof Wallet;
    tone: Tone;
    description: string;
  }[] = [
    {
      title: 'Patrimônio Total',
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      tone: stats.totalBalance >= 0 ? 'income' : 'expense',
      description: 'Receitas + limite dos cartões − despesas pagas',
    },
    {
      title: 'Total Receitas',
      value: formatCurrency(stats.totalIncome),
      icon: ArrowUpCircle,
      tone: 'income',
      description:
        stats.cardLimit > 0
          ? `${periodLabel} · inclui ${formatCurrency(stats.cardLimit)} de limite de cartões`
          : periodLabel,
    },
    {
      title: 'Total Despesas',
      value: formatCurrency(stats.totalExpense),
      icon: ArrowDownCircle,
      tone: 'expense',
      description: periodLabel,
    },
    {
      title: 'Resultado Líquido',
      value: formatCurrency(stats.balance),
      icon: stats.balance >= 0 ? ArrowUpCircle : ArrowDownCircle,
      tone: stats.balance >= 0 ? 'income' : 'expense',
      description: 'Receitas - Despesas',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <PeriodLoading key={card.title} size="sm" className="rounded-2xl">
          {/* M3: elevação do próprio Card (tema) + leve realce no hover, sem borda. */}
          <Card className="hover-elevate h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <Box
                sx={{
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  bgcolor: `rgba(var(--mui-palette-${card.tone}-mainChannel) / 0.12)`,
                  color: `${card.tone}.main`,
                }}
              >
                <card.icon className="h-4 w-4" />
              </Box>
            </CardHeader>
            <CardContent>
              <Box
                sx={{ color: `${card.tone}.main` }}
                className="text-xl font-bold tabular-nums xl:text-2xl"
                title={card.value}
              >
                {card.value}
              </Box>
              <p className="text-muted-foreground mt-1 text-xs">{card.description}</p>
            </CardContent>
          </Card>
        </PeriodLoading>
      ))}
    </div>
  );
}
