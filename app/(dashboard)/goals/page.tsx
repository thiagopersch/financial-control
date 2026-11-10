import { getSession } from '@/lib/auth/session';
import { getGoalsData } from '@/lib/queries/dashboard';
import { Target } from 'lucide-react';
import { redirect } from 'next/navigation';
import { GoalsPageClient } from './goals-client';

export default async function GoalsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const goals = await getGoalsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
        <p className="text-muted-foreground">Planos e objetivos de longo prazo.</p>
      </div>

      <div className="absolute top-0 right-0 z-0 p-4 opacity-5 max-md:hidden">
        <Target size={120} />
      </div>

      <GoalsPageClient initialGoals={goals} />
    </div>
  );
}
