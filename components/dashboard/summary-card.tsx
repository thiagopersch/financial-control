import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, PiggyBank, Landmark } from 'lucide-react';
import Link from 'next/link';

interface SummaryCardProps {
  goalsCount: number;
  budgetsCount: number;
  debtsCount: number;
}

const cards = [
  {
    title: 'Metas',
    valueKey: 'goalsCount' as const,
    href: '/goals',
    icon: Target,
    color: 'text-primary',
    bg: 'bg-primary/10',
    description: 'Total de metas',
  },
  {
    title: 'Orçamentos',
    valueKey: 'budgetsCount' as const,
    href: '/budgets',
    icon: PiggyBank,
    color: 'text-primary',
    bg: 'bg-primary/10',
    description: 'Total de orçamentos',
  },
  {
    title: 'Dívidas',
    valueKey: 'debtsCount' as const,
    href: '/debts',
    icon: Landmark,
    color: 'text-red-600',
    bg: 'bg-red-100',
    description: 'Total de dívidas ativas',
  },
];

export function SummaryCard({ goalsCount, budgetsCount, debtsCount }: SummaryCardProps) {
  const values = { goalsCount, budgetsCount, debtsCount };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="cursor-pointer overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{values[card.valueKey]}</div>
              <p className="text-muted-foreground mt-1 text-xs">{card.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
