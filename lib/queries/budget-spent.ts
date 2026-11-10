import prisma from '@/lib/prisma';

/**
 * Despesas pagas por categoria num mês (pela data da transação), numa única
 * query agrupada — substitui um `aggregate` por orçamento (N+1).
 */
export async function getPaidExpensesByCategory(
  workspaceId: string,
  month: number,
  year: number,
  categoryIds?: string[],
): Promise<Map<string, number>> {
  if (categoryIds && categoryIds.length === 0) return new Map();

  const groups = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      workspaceId,
      type: 'EXPENSE',
      status: 'PAID',
      date: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      },
      ...(categoryIds ? { categoryId: { in: [...new Set(categoryIds)] } } : {}),
    },
    _sum: { amount: true },
  });

  return new Map(groups.map((g) => [g.categoryId, Number(g._sum.amount || 0)]));
}
