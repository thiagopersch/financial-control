import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { BudgetsPageClient } from './budgets-client';

export default async function BudgetsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const categories = await prisma.category.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      type: 'EXPENSE',
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
        <p className="text-muted-foreground">
          Gerencie seus limites de gastos mensais por categoria.
        </p>
        <Alert className="mt-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Dica Financeira</AlertTitle>
          <AlertDescription>
            Orçamentos ajudam você a manter o controle sobre gastos variáveis. Tente não comprometer
            mais de 50% da sua receita com gastos essenciais.
          </AlertDescription>
        </Alert>
      </div>

      <BudgetsPageClient categories={categories} />
    </div>
  );
}
