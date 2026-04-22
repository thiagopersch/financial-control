import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { RulesHeader } from '@/components/rules/rules-header';
import { RulesList } from '@/components/rules/rules-list';

export default async function RulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [rules, categories] = await Promise.all([
    prisma.categorizationRule.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="animate-in fade-in space-y-6 duration-700">
      <RulesHeader categories={categories} userRole={session.user.role} />
      <RulesList rules={rules} categories={categories} userRole={session.user.role} />
    </div>
  );
}
