import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';
import { getRulesPaginated } from '@/lib/queries/rules';
import { RulesContent } from '@/components/rules/rules-content';
import { parsePageSize } from '@/lib/constants/pagination';

export default async function RulesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const pageSize = parsePageSize(searchParams.pageSize);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const [{ rules, totalCount }, categories] = await Promise.all([
    getRulesPaginated({
      q: searchParams.q,
      category: searchParams.category,
      page,
      pageSize,
    }),
    prisma.category.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="animate-in fade-in space-y-6 duration-700">
      <RulesContent
        rules={rules}
        categories={categories}
        canModify={hasPermission(session.user.permissions, 'rules', 'CREATE')}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
