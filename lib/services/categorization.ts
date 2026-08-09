import prisma from '@/lib/prisma';

/**
 * Matches a transaction description/notes against configured CategorizationRule
 * keywords (highest priority first) and returns the matching category id, if any.
 */
export async function matchCategorizationRule(
  workspaceId: string,
  text: string,
): Promise<string | null> {
  if (!text) return null;

  try {
    const rules = await prisma.categorizationRule.findMany({
      where: { workspaceId },
      orderBy: { priority: 'desc' },
    });

    const normalized = text.toLowerCase();
    const match = rules.find((rule) => normalized.includes(rule.keyword.toLowerCase()));
    return match?.categoryId ?? null;
  } catch (error) {
    console.error('Error matching categorization rule:', error);
    return null;
  }
}
