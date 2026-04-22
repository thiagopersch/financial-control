'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Banknote } from 'lucide-react';
import Link from 'next/link';

interface Debt {
  id: string;
  name: string;
  currentValue: number;
  minimumPayment: number;
  installments: number | null;
}

interface DebtsWidgetProps {
  debts: Debt[];
  totalDebt: number;
}

export function DebtsWidget({ debts, totalDebt }: DebtsWidgetProps) {
  if (debts.length === 0) {
    return (
      <Link href="/debts" className="block h-full w-full">
        <Card className="h-full w-full cursor-pointer transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Dívidas</CardTitle>
            <CardDescription>Acompanhe suas dívidas e financiamentos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-muted mb-3 rounded-full p-3">
              <AlertCircle className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground text-sm">Nenhuma dívida ativa.</p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href="/debts" className="block h-full w-full">
      <Card className="h-full w-full cursor-pointer transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-rose-100 p-2">
              <Banknote className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-base">Dívidas</CardTitle>
              <CardDescription className="text-xs">
                Total: {formatCurrency(totalDebt)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className="flex items-center justify-between text-sm">
              <span className="truncate font-medium">{debt.name}</span>
              <span className="font-medium text-rose-600">{formatCurrency(debt.currentValue)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
