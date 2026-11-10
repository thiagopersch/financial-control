import { getSession } from '@/lib/auth/session';
import { cachedForWorkspace } from '@/lib/cache/redis';
import { CHART_STATUS_COLORS, getCategoricalColor } from '@/lib/chart-colors';
import { DEBT_OPEN_STATUSES } from '@/lib/constants/debt-status';
import prisma from '@/lib/prisma';
import {
  addCompetenceMonths,
  competenceFromYearMonth,
  competenceRange,
} from '@/lib/utils/competence';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Intervalo de competência (`{ gte, lte }` na coluna `competence`); `undefined` = todos os períodos. */
export type CompetenceFilter = { gte: Date; lte: Date } | undefined;

function competenceWhere(competence: CompetenceFilter): Prisma.TransactionWhereInput {
  return competence ? { competence } : {};
}

/** Dashboard: agregados por workspace/período ficam 60s no Redis e caem a cada escrita em transação. */
const DASHBOARD_TTL_SEC = 60;

function competenceKey(competence: CompetenceFilter) {
  return competence ? `${competence.gte.toISOString()}_${competence.lte.toISOString()}` : 'all';
}

function sumAmount(rows: { _sum: { amount: Prisma.Decimal | null } }[]) {
  return rows.reduce((acc, row) => acc + Number(row._sum.amount || 0), 0);
}

async function requireWorkspaceId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.user.workspaceId;
}

export async function getDashboardStats(competence?: CompetenceFilter) {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(
    workspaceId,
    ['tx', 'credit-cards'],
    ['dash-stats', competenceKey(competence)],
    DASHBOARD_TTL_SEC,
    async () => {
      const previous = competence
        ? {
            gte: addCompetenceMonths(competence.gte, -1),
            lte: addCompetenceMonths(competence.lte, -1),
          }
        : undefined;

      // Tudo agregado no banco e em paralelo — nada de carregar a tabela de transações.
      const [allIncome, paidExpenses, cardLimitAggregate, periodGroups, previousGroups] =
        await Promise.all([
          prisma.transaction.aggregate({
            where: { workspaceId, type: TransactionType.INCOME },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              workspaceId,
              type: TransactionType.EXPENSE,
              status: TransactionStatus.PAID,
              creditCardId: null,
            },
            _sum: { amount: true },
          }),
          prisma.creditCard.aggregate({
            where: { account: { workspaceId } },
            _sum: { limit: true },
          }),
          prisma.transaction.groupBy({
            by: ['type', 'status'],
            where: { workspaceId, ...competenceWhere(competence) },
            _sum: { amount: true },
          }),
          previous
            ? prisma.transaction.groupBy({
                by: ['type'],
                where: { workspaceId, competence: previous },
                _sum: { amount: true },
              })
            : Promise.resolve([]),
        ]);

      // Limite total dos cartões entra como recurso disponível no patrimônio e nas receitas.
      const totalCardLimit = Number(cardLimitAggregate._sum.limit || 0);

      // Patrimônio = todas as receitas cadastradas (pagas ou não) + limite dos cartões
      // − despesas já pagas. Compras no cartão ficam de fora: o pagamento da fatura é
      // registrado como uma despesa própria (sem creditCardId) e contar as duas duplicaria.
      const totalBalance =
        Number(allIncome._sum.amount || 0) + totalCardLimit - Number(paidExpenses._sum.amount || 0);

      const totalIncome =
        sumAmount(periodGroups.filter((g) => g.type === TransactionType.INCOME)) + totalCardLimit;
      const totalExpense = sumAmount(
        periodGroups.filter((g) => g.type === TransactionType.EXPENSE),
      );
      const pendingToPay = sumAmount(
        periodGroups.filter(
          (g) => g.type === TransactionType.EXPENSE && g.status === TransactionStatus.PENDING,
        ),
      );
      const balance = totalIncome - totalExpense;

      // Comparação com o período anterior
      const lastMonthIncome = previous
        ? sumAmount(previousGroups.filter((g) => g.type === TransactionType.INCOME)) +
          totalCardLimit
        : 0;
      const lastMonthExpense = previous
        ? sumAmount(previousGroups.filter((g) => g.type === TransactionType.EXPENSE))
        : 0;

      const incomeGrowth =
        lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      const expenseGrowth =
        lastMonthExpense > 0 ? ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

      return {
        totalIncome,
        totalExpense,
        totalBalance,
        cardLimit: totalCardLimit,
        balance,
        pendingToPay,
        incomeGrowth,
        expenseGrowth,
      };
    },
  );
}

export async function getBudgetData(month: number, year: number) {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(
    workspaceId,
    ['tx', 'budgets', 'categories'],
    ['dash-budgets', year, month],
    DASHBOARD_TTL_SEC,
    async () => {
      const [budgets, spentByCategory] = await Promise.all([
        prisma.budget.findMany({
          where: { workspaceId, month, year },
          include: { category: true },
        }),
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            workspaceId,
            type: TransactionType.EXPENSE,
            competence: competenceRange(year, month),
          },
          _sum: { amount: true },
        }),
      ]);

      const spentMap = new Map(
        spentByCategory.map((g) => [g.categoryId, Number(g._sum.amount || 0)]),
      );

      return budgets.map((budget) => {
        const spent = spentMap.get(budget.categoryId) ?? 0;
        return {
          ...budget,
          amount: Number(budget.amount),
          spent,
          percent: (spent / Number(budget.amount)) * 100,
        };
      });
    },
  );
}

export async function getGoalsData() {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(workspaceId, 'goals', ['dash-goals'], DASHBOARD_TTL_SEC, async () => {
    const goals = await prisma.goal.findMany({ where: { workspaceId } });

    return goals.map((goal) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      percent: (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
    }));
  });
}

export async function getRecentTransactions(competence?: CompetenceFilter) {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(
    workspaceId,
    'tx',
    ['dash-recent', competenceKey(competence)],
    DASHBOARD_TTL_SEC,
    () =>
      prisma.transaction.findMany({
        where: { workspaceId, ...competenceWhere(competence) },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          supplier: true,
          account: true,
        },
      }),
  );
}

export async function getChartData(
  month: Date,
  isFullYear: boolean = false,
  isAllPeriod: boolean = false,
) {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(
    workspaceId,
    'tx',
    ['dash-chart', format(month, 'yyyy-MM'), Number(isFullYear), Number(isAllPeriod)],
    DASHBOARD_TTL_SEC,
    async () => {
      let monthsToFetch = isFullYear ? 12 : 6;
      let baseDate = isFullYear ? new Date(month.getFullYear(), 11, 1) : month;

      if (isAllPeriod) {
        const result = await prisma.transaction.aggregate({
          where: { workspaceId },
          _min: { competence: true },
          _max: { competence: true },
        });
        if (result._min.competence && result._max.competence) {
          const minDate = new Date(result._min.competence);
          const maxDate = new Date(result._max.competence);
          const diffMonths =
            (maxDate.getUTCFullYear() - minDate.getUTCFullYear()) * 12 +
            (maxDate.getUTCMonth() - minDate.getUTCMonth()) +
            1;
          monthsToFetch = Math.max(diffMonths, 12);
          baseDate = new Date(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1);
        } else {
          monthsToFetch = 12;
          baseDate = new Date();
        }
      }

      const periods = Array.from({ length: monthsToFetch })
        .map((_, i) => {
          const date = subMonths(baseDate, i);
          return {
            competence: competenceFromYearMonth(date.getFullYear(), date.getMonth() + 1),
            label: format(date, 'MMM', { locale: ptBR }),
          };
        })
        .reverse();

      // Uma única query agrupada por competência/tipo (antes: uma query por mês).
      const groups = await prisma.transaction.groupBy({
        by: ['competence', 'type'],
        where: {
          workspaceId,
          competence: { in: periods.map((p) => p.competence) },
          type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
        },
        _sum: { amount: true },
      });

      const totals = new Map<string, { income: number; expense: number }>();
      for (const group of groups) {
        const key = group.competence.toISOString();
        const entry = totals.get(key) ?? { income: 0, expense: 0 };
        if (group.type === TransactionType.INCOME) entry.income += Number(group._sum.amount || 0);
        else entry.expense += Number(group._sum.amount || 0);
        totals.set(key, entry);
      }

      return periods.map((period) => {
        const entry = totals.get(period.competence.toISOString());
        return {
          name: period.label,
          receitas: entry?.income ?? 0,
          despesas: entry?.expense ?? 0,
        };
      });
    },
  );
}

export async function getCategoryData(competence?: CompetenceFilter) {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(
    workspaceId,
    ['tx', 'categories'],
    ['dash-categories', competenceKey(competence)],
    DASHBOARD_TTL_SEC,
    async () => {
      const groups = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { workspaceId, type: TransactionType.EXPENSE, ...competenceWhere(competence) },
        _sum: { amount: true },
      });
      if (groups.length === 0) return [];

      const categories = await prisma.category.findMany({
        where: { id: { in: groups.map((g) => g.categoryId) }, workspaceId },
        select: { id: true, name: true, color: true },
      });
      const categoryById = new Map(categories.map((c) => [c.id, c]));

      // Agrupa por nome (categorias homônimas somam juntas, como antes).
      const categoryMap = new Map<string, { value: number; color: string }>();
      for (const group of groups) {
        const category = categoryById.get(group.categoryId);
        if (!category) continue;
        const entry = categoryMap.get(category.name) ?? { value: 0, color: category.color };
        entry.value += Number(group._sum.amount || 0);
        categoryMap.set(category.name, entry);
      }

      return Array.from(categoryMap, ([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));
    },
  );
}

export async function getStatusData(competence?: CompetenceFilter) {
  const workspaceId = await requireWorkspaceId();

  const transactions = await cachedForWorkspace(
    workspaceId,
    'tx',
    ['dash-status', competenceKey(competence)],
    DASHBOARD_TTL_SEC,
    () =>
      prisma.transaction.groupBy({
        by: ['status'],
        where: { workspaceId, type: TransactionType.EXPENSE, ...competenceWhere(competence) },
        _sum: { amount: true },
        _count: true,
      }),
  );

  const statusLabels: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Pago', color: CHART_STATUS_COLORS.PAID },
    PENDING: { label: 'Pendente', color: CHART_STATUS_COLORS.PENDING },
    OVERDUE: { label: 'Atrasado', color: CHART_STATUS_COLORS.OVERDUE },
  };

  return transactions.map((t) => ({
    name: statusLabels[t.status]?.label || t.status,
    value: Number(t._sum.amount || 0),
    count: t._count,
    color: statusLabels[t.status]?.color || '#94a3b8',
  }));
}

export async function getSupplierData(competence?: CompetenceFilter) {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(
    workspaceId,
    ['tx', 'suppliers'],
    ['dash-suppliers', competenceKey(competence)],
    DASHBOARD_TTL_SEC,
    async () => {
      const groups = await prisma.transaction.groupBy({
        by: ['supplierId'],
        where: {
          workspaceId,
          type: TransactionType.EXPENSE,
          supplierId: { not: null },
          ...competenceWhere(competence),
        },
        _sum: { amount: true },
      });
      const supplierIds = groups.map((g) => g.supplierId).filter((id): id is string => !!id);
      if (supplierIds.length === 0) return [];

      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: supplierIds }, workspaceId },
        select: { id: true, name: true },
      });
      const nameById = new Map(suppliers.map((s) => [s.id, s.name]));

      const supplierMap = new Map<string, number>();
      for (const group of groups) {
        const name = group.supplierId ? nameById.get(group.supplierId) : undefined;
        if (!name) continue;
        supplierMap.set(name, (supplierMap.get(name) ?? 0) + Number(group._sum.amount || 0));
      }

      return Array.from(supplierMap, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
        .map((entry, index) => ({ ...entry, color: getCategoricalColor(index) }));
    },
  );
}

/**
 * Despesas pagas agrupadas por "Pago por" no período (competência). Transações
 * sem usuário vinculado entram no grupo "Não informado".
 */
export async function getPaidByData(competence?: CompetenceFilter) {
  const workspaceId = await requireWorkspaceId();

  const { groups, users } = await cachedForWorkspace(
    workspaceId,
    'tx',
    ['dash-paid-by', competenceKey(competence)],
    DASHBOARD_TTL_SEC,
    async () => {
      const groups = await prisma.transaction.groupBy({
        by: ['paidById'],
        where: {
          workspaceId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.PAID,
          ...competenceWhere(competence),
        },
        _sum: { amount: true },
        _count: true,
      });
      const userIds = groups.map((g) => g.paidById).filter((id): id is string => !!id);
      const users = userIds.length
        ? await prisma.user.findMany({
            where: { id: { in: userIds }, workspaceId },
            select: { id: true, name: true, email: true },
          })
        : [];
      return { groups, users };
    },
  );
  const userNames = new Map(users.map((u) => [u.id, u.name || u.email]));

  return groups
    .map((g) => ({
      name: g.paidById ? (userNames.get(g.paidById) ?? 'Usuário removido') : 'Não informado',
      value: Number(g._sum.amount || 0),
      count: g._count,
      isUnassigned: !g.paidById,
    }))
    .sort((a, b) => Number(a.isUnassigned) - Number(b.isUnassigned) || b.value - a.value)
    .map(({ isUnassigned, ...entry }, index) => ({
      ...entry,
      color: isUnassigned ? '#94a3b8' : getCategoricalColor(index),
    }));
}

export async function getTransactionCountsByYear() {
  const workspaceId = await requireWorkspaceId();

  return cachedForWorkspace(workspaceId, 'tx', ['tx-counts-year'], 300, async () => {
    // Agrupa por competência no banco (no máximo 12 linhas por ano) e soma por ano.
    const groups = await prisma.transaction.groupBy({
      by: ['competence'],
      where: { workspaceId },
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    for (const group of groups) {
      const year = group.competence.getUTCFullYear().toString();
      counts[year] = (counts[year] || 0) + group._count._all;
    }
    return counts;
  });
}

export async function getSummaryCount(
  startDate: Date | undefined,
  endDate: Date | undefined,
  month: number,
  year: number,
) {
  const workspaceId = await requireWorkspaceId();

  const goalWhere: Prisma.GoalWhereInput = { workspaceId };
  if (startDate && endDate) {
    goalWhere.OR = [{ deadline: null }, { deadline: { gte: startDate, lte: endDate } }];
  }

  const debtWhere: Prisma.DebtWhereInput = { workspaceId, status: { in: DEBT_OPEN_STATUSES } };
  if (startDate && endDate) {
    debtWhere.startDate = { lte: endDate };
    debtWhere.OR = [{ endDate: null }, { endDate: { gte: startDate } }];
  }

  const [budgetCount, goalCount, debtCount] = await Promise.all([
    prisma.budget.count({ where: { workspaceId, month, year } }),
    prisma.goal.count({ where: goalWhere }),
    prisma.debt.count({ where: debtWhere }),
  ]);

  return { goalsCount: goalCount, budgetsCount: budgetCount, debtsCount: debtCount };
}

export async function getDebtsData() {
  const workspaceId = await requireWorkspaceId();

  const debts = await prisma.debt.findMany({
    where: { workspaceId, status: { in: DEBT_OPEN_STATUSES } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: {
      id: true,
      name: true,
      currentValue: true,
      initialValue: true,
      minimumPayment: true,
      installments: true,
    },
  });

  const totalDebt = debts.reduce((acc, d) => acc + Number(d.currentValue), 0);

  return {
    debts: debts.map((d) => ({
      id: d.id,
      name: d.name,
      currentValue: Number(d.currentValue),
      initialValue: Number(d.initialValue),
      minimumPayment: Number(d.minimumPayment),
      installments: d.installments,
    })),
    totalDebt,
  };
}
