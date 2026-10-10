import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';
import { parseMultiParam, toInFilter } from '@/lib/utils/filter-params';

export type GetRulesParams = {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function getRulesPaginated(params: GetRulesParams = {}) {
  const session = await getServerSession(authOptions);
  if (!session) return { rules: [], totalCount: 0 };

  const { q, category, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  where.categoryId = toInFilter(parseMultiParam(category));

  if (q) {
    const query = q.trim();
    where.keyword = { contains: query, mode: 'insensitive' };
  }

  const [rules, totalCount] = await Promise.all([
    prisma.categorizationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.categorizationRule.count({ where }),
  ]);

  return { rules, totalCount };
}
