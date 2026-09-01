import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';

const ID_FIELD_TO_MODEL: Record<string, string> = {
  categoryId: 'category',
  accountId: 'account',
  fromAccountId: 'account',
  toAccountId: 'account',
  paymentAccountId: 'account',
  supplierId: 'supplier',
  costCenterId: 'costCenter',
  parentTransactionId: 'transaction',
  transactionId: 'transaction',
  paymentMethodId: 'paymentMethod',
  creditCardId: 'creditCard',
  goalId: 'goal',
  budgetId: 'budget',
  debtId: 'debt',
  permissionProfileId: 'permissionProfile',
};

const ENTITY_TO_MODEL: Record<string, string> = {
  Account: 'account',
  Category: 'category',
  Supplier: 'supplier',
  CostCenter: 'costCenter',
  Debt: 'debt',
  Goal: 'goal',
  User: 'user',
  ConditionalRule: 'conditionalRule',
  Transaction: 'transaction',
  PaymentMethod: 'paymentMethod',
  CreditCard: 'creditCard',
  Invoice: 'invoice',
  Budget: 'budget',
  PermissionProfile: 'permissionProfile',
};

// Models whose display name isn't a plain `name` (or `description`) column —
// built from a related record instead so the audit UI never falls back to a raw id.
const CUSTOM_NAME_RESOLVERS: Record<string, (ids: string[]) => Promise<Record<string, string>>> = {
  creditCard: async (ids) => {
    const rows = await prisma.creditCard.findMany({
      where: { id: { in: ids } },
      select: { id: true, account: { select: { name: true } } },
    });
    return Object.fromEntries(rows.map((r) => [r.id, `Cartão ${r.account.name}`]));
  },
  invoice: async (ids) => {
    const rows = await prisma.invoice.findMany({
      where: { id: { in: ids } },
      select: { id: true, month: true, year: true, creditCard: { include: { account: true } } },
    });
    return Object.fromEntries(
      rows.map((r) => [r.id, `Fatura ${r.month}/${r.year} - ${r.creditCard.account.name}`]),
    );
  },
  budget: async (ids) => {
    const rows = await prisma.budget.findMany({
      where: { id: { in: ids } },
      select: { id: true, month: true, year: true, category: { select: { name: true } } },
    });
    return Object.fromEntries(
      rows.map((r) => [r.id, `Orçamento ${r.category.name} ${r.month}/${r.year}`]),
    );
  },
};

async function resolveNames(
  logs: { entity: string; entityId: string | null; oldValue: any; newValue: any }[],
) {
  const idsByModel: Record<string, Set<string>> = {};

  const addId = (model: string | undefined, id: unknown) => {
    if (!model || typeof id !== 'string' || !id) return;
    (idsByModel[model] ??= new Set()).add(id);
  };

  for (const log of logs) {
    addId(ENTITY_TO_MODEL[log.entity], log.entityId);
    for (const value of [log.oldValue, log.newValue]) {
      if (value && typeof value === 'object') {
        for (const [key, val] of Object.entries(value)) {
          addId(ID_FIELD_TO_MODEL[key], val);
        }
      }
    }
  }

  const names: Record<string, string> = {};

  await Promise.all(
    Object.entries(idsByModel).map(async ([model, ids]) => {
      if (ids.size === 0) return;
      const idList = Array.from(ids);

      const customResolver = CUSTOM_NAME_RESOLVERS[model];
      if (customResolver) {
        try {
          Object.assign(names, await customResolver(idList));
        } catch {
          // Referenced record may have been deleted since — leave it unresolved.
        }
        return;
      }

      const delegate = (prisma as any)[model];
      if (!delegate) return;
      const nameField = model === 'transaction' ? 'description' : 'name';
      const rows = await delegate.findMany({
        where: { id: { in: idList } },
        select: { id: true, [nameField]: true },
      });
      for (const row of rows) {
        names[row.id] = row[nameField] || (model === 'transaction' ? 'Transação' : row.id);
      }
    }),
  );

  return names;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (!hasPermission(session.user.permissions, 'audit', 'VIEW')) {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      workspaceId: session.user.workspaceId,
    };

    if (entity && entity !== 'all') {
      where.entity = entity;
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    const offset = (page - 1) * limit;

    const [logs, total, actionGroups] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          action: true,
          entity: true,
          entityId: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { workspaceId: session.user.workspaceId },
      }),
    ]);

    const names = await resolveNames(logs);
    const availableActions = actionGroups.map((g) => g.action).sort();

    return NextResponse.json({
      logs,
      names,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      availableActions,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Erro ao buscar logs de auditoria' }, { status: 500 });
  }
}
