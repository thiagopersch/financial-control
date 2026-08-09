import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

const ID_FIELD_TO_MODEL: Record<string, string> = {
  categoryId: 'category',
  accountId: 'account',
  fromAccountId: 'account',
  toAccountId: 'account',
  supplierId: 'supplier',
  costCenterId: 'costCenter',
  parentTransactionId: 'transaction',
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
};

async function resolveNames(logs: { entity: string; entityId: string | null; oldValue: any; newValue: any }[]) {
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
      const delegate = (prisma as any)[model];
      if (!delegate || ids.size === 0) return;
      const nameField = model === 'transaction' ? 'description' : 'name';
      const rows = await delegate.findMany({
        where: { id: { in: Array.from(ids) } },
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
    if (session.user.role !== 'ADMIN') {
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

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
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
    ]);

    const names = await resolveNames(logs);

    return NextResponse.json({
      logs,
      names,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Erro ao buscar logs de auditoria' }, { status: 500 });
  }
}
