import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getServerSession } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

/**
 * Lightweight transaction search used by the notification-template test-send
 * picker (components/ui/async-select-search.tsx): no `q` returns the most
 * recent transactions, a `q` filters by description/category name.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const limitParam = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        ...(q
          ? {
              OR: [
                { description: { contains: q, mode: 'insensitive' } },
                { category: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        label: `${t.description || t.category.name} — ${formatCurrency(Number(t.amount))} — ${format(t.date, 'dd/MM/yyyy', { locale: ptBR })}`,
        date: t.date.toISOString(),
        amount: Number(t.amount),
      })),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }
}
