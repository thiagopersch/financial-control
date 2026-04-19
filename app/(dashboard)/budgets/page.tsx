import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { AlertCircle } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BudgetsPageClient } from './budgets-client';

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);
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
        <div className="flex items-start gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-bold">Dica Financeira</p>
            <p>
              Orçamentos ajudam você a manter o controle sobre gastos variáveis. Tente não
              comprometer mais de 50% da sua receita com gastos essenciais.
            </p>
          </div>
        </div>
      </div>

      <BudgetsPageClient categories={categories} />
    </div>
  );
}