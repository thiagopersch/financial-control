import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { competenceRangeFromPeriodParams } from '@/lib/utils/competence';
import { PAID_BY_NONE, parseMultiParam, toInFilter } from '@/lib/utils/filter-params';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { endOfDay, isValid, parse } from 'date-fns';
import { getServerSession } from 'next-auth';
import * as z from 'zod';

const STATUS_SEARCH_TERMS: Record<string, TransactionStatus> = {
  pago: TransactionStatus.PAID,
  pendente: TransactionStatus.PENDING,
  atrasado: TransactionStatus.OVERDUE,
  atrasada: TransactionStatus.OVERDUE,
};

const optionalParam = z.string().trim().optional().nullable();

const transactionListParamsSchema = z.object({
  year: optionalParam,
  month: optionalParam,
  from: optionalParam,
  to: optionalParam,
  q: optionalParam,
  type: optionalParam,
  status: optionalParam,
  category: optionalParam,
  account: optionalParam,
  paidBy: optionalParam,
});

export type TransactionListParams = z.infer<typeof transactionListParamsSchema>;

function parseDateParam(value?: string | null) {
  if (!value) return undefined;
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) ? date : undefined;
}

/**
 * Monta o `where` da listagem de transações a partir dos search params da página
 * (mesmos params usados pelo export, para que ambos sempre batam):
 * - `year`/`month`: período por **competência**
 * - `from`/`to`: intervalo da data de vencimento (`yyyy-MM-dd`)
 * - `type`, `status`, `category`, `account`, `paidBy`: multi-seleção (`a,b,c`)
 * - `q`: busca textual
 */
export function buildTransactionWhere(
  rawParams: Record<string, string | string[] | null | undefined>,
  workspaceId: string,
): Prisma.TransactionWhereInput {
  const params = transactionListParamsSchema.parse(
    Object.fromEntries(
      Object.entries(rawParams).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );

  const where: Prisma.TransactionWhereInput = { workspaceId };
  const and: Prisma.TransactionWhereInput[] = [];

  const competence = competenceRangeFromPeriodParams(params.year, params.month);
  if (competence) where.competence = competence;

  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);
  if (from || to) {
    where.date = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  const types = parseMultiParam(params.type).filter((value): value is TransactionType =>
    Object.values(TransactionType).includes(value as TransactionType),
  );
  const statuses = parseMultiParam(params.status).filter((value): value is TransactionStatus =>
    Object.values(TransactionStatus).includes(value as TransactionStatus),
  );
  where.type = toInFilter(types);
  where.status = toInFilter(statuses);
  where.categoryId = toInFilter(parseMultiParam(params.category));
  where.accountId = toInFilter(parseMultiParam(params.account));

  const paidBy = parseMultiParam(params.paidBy);
  if (paidBy.length > 0) {
    const userIds = paidBy.filter((value) => value !== PAID_BY_NONE);
    const includeNone = paidBy.includes(PAID_BY_NONE);
    and.push({
      OR: [
        ...(userIds.length > 0 ? [{ paidById: { in: userIds } }] : []),
        ...(includeNone ? [{ paidById: null }] : []),
      ],
    });
  }

  if (params.q) {
    const q = params.q;
    const statusMatch = STATUS_SEARCH_TERMS[q.toLowerCase()];
    and.push({
      OR: [
        { description: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
        { account: { name: { contains: q, mode: 'insensitive' } } },
        { paidBy: { name: { contains: q, mode: 'insensitive' } } },
        ...(statusMatch ? [{ status: statusMatch }] : []),
      ],
    });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

export type DebtTransactionDTO = {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  status: TransactionStatus;
  categoryName: string | null;
  categoryColor: string | null;
  categoryId: string | null;
  accountId: string | null;
  paymentMethodId: string | null;
  creditCardId: string | null;
  costCenterId: string | null;
  dueDate: string | null;
  competence: string;
  originalCompetence: string;
  paidAt: string | null;
  paidById: string | null;
  notes: string | null;
};

export async function getTransactionsByDebtId(debtId: string): Promise<DebtTransactionDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const transactions = await prisma.transaction.findMany({
      where: { debtId, workspaceId: session.user.workspaceId },
      include: { category: { select: { name: true, color: true } } },
      orderBy: [{ competence: 'asc' }, { dueDate: 'asc' }, { date: 'asc' }],
    });

    return transactions.map((t) => ({
      id: t.id,
      description: t.description,
      date: t.date.toISOString(),
      amount: Number(t.amount),
      status: t.status,
      categoryName: t.category?.name ?? null,
      categoryColor: t.category?.color ?? null,
      categoryId: t.categoryId ?? null,
      accountId: t.accountId ?? null,
      paymentMethodId: t.paymentMethodId ?? null,
      creditCardId: t.creditCardId ?? null,
      costCenterId: t.costCenterId ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      competence: t.competence.toISOString(),
      originalCompetence: t.originalCompetence.toISOString(),
      paidAt: t.paidAt?.toISOString() ?? null,
      paidById: t.paidById ?? null,
      notes: t.notes ?? null,
    }));
  } catch (error) {
    console.error('Error fetching transactions by debt:', error);
    return [];
  }
}
