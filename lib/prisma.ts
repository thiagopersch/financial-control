import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';
import { cache } from 'react';
import { bumpWorkspaceVersion, type WorkspaceCacheScope } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

/**
 * Pool de conexões. Em serverless cada instância tem o próprio pool, então o
 * `max` é baixo (o pooler do Neon — `DATABASE_URL` com `-pooler` — multiplexa
 * do lado do banco) e as conexões ociosas são liberadas rápido.
 */
function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  // Fluid compute: fecha conexões ociosas antes da instância ser suspensa.
  if (process.env.VERCEL) attachDatabasePool(pool);
  return pool;
}

// ---------------------------------------------------------------------------
// Invalidação automática de cache: toda escrita num model abaixo incrementa a
// versão do escopo do workspace (ver `lib/cache/redis.ts`), então nenhuma
// action precisa lembrar de invalidar o cache manualmente.
// ---------------------------------------------------------------------------

const MODEL_SCOPES: Record<string, WorkspaceCacheScope[]> = {
  Transaction: ['tx'],
  Transfer: ['tx'],
  Budget: ['budgets'],
  Goal: ['goals'],
  Category: ['categories'],
  Supplier: ['suppliers'],
  Account: ['accounts'],
  CreditCard: ['credit-cards'],
  Invoice: ['credit-cards'],
  PaymentMethod: ['payment-methods'],
  CostCenter: ['cost-centers'],
  Debt: ['debts'],
};

const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
  'delete',
  'deleteMany',
]);

function pickWorkspaceId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) return pickWorkspaceId(value[0]);
  const candidate = (value as { workspaceId?: unknown }).workspaceId;
  return typeof candidate === 'string' ? candidate : undefined;
}

async function resolveWorkspaceId(args: unknown, result: unknown): Promise<string | undefined> {
  const a = (args ?? {}) as { data?: unknown; where?: unknown; create?: unknown };
  const fromQuery =
    pickWorkspaceId(result) ??
    pickWorkspaceId(a.data) ??
    pickWorkspaceId(a.create) ??
    pickWorkspaceId(a.where);
  if (fromQuery) return fromQuery;
  try {
    // Import dinâmico: evita ciclo prisma → session → auth-options → prisma.
    const { getSession } = await import('@/lib/auth/session');
    return (await getSession())?.user.workspaceId;
  } catch {
    return undefined; // fora de um request (cron/jobs): o TTL do cache cobre
  }
}

// ---------------------------------------------------------------------------
// Detector de N+1 (só em dev): conta as queries feitas durante o render de um
// request e avisa quando passa do limite — sinal clássico de query em loop.
// ---------------------------------------------------------------------------

const QUERY_WARN_THRESHOLD = Number(process.env.PRISMA_QUERY_WARN ?? 30);
const getRequestQueryCounter = cache(() => ({
  count: 0,
  warned: false,
  models: {} as Record<string, number>,
}));

function trackQuery(model: string, operation: string) {
  if (process.env.NODE_ENV === 'production') return;
  const counter = getRequestQueryCounter();
  counter.count += 1;
  const key = `${model}.${operation}`;
  counter.models[key] = (counter.models[key] ?? 0) + 1;
  if (!counter.warned && counter.count > QUERY_WARN_THRESHOLD) {
    counter.warned = true;
    logger.warn('prisma.possible_n_plus_one', {
      queries: counter.count,
      threshold: QUERY_WARN_THRESHOLD,
      top: Object.entries(counter.models)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    });
  }
}

const prismaClientSingleton = () => {
  const adapter = new PrismaPg(createPool());
  return new PrismaClient({ adapter }).$extends({
    name: 'cache-invalidation-and-n-plus-one',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          trackQuery(model, operation);
          const result = await query(args);
          const scopes = MODEL_SCOPES[model];
          if (scopes && WRITE_OPERATIONS.has(operation)) {
            const workspaceId = await resolveWorkspaceId(args, result);
            if (workspaceId) await bumpWorkspaceVersion(workspaceId, ...scopes);
          }
          return result;
        },
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

/**
 * Cliente aceito por funções que rodam tanto fora quanto dentro de
 * `prisma.$transaction(async (tx) => ...)` (substitui `Prisma.TransactionClient`,
 * que não aceita o cliente estendido).
 */
export type DbClient = Omit<
  ReturnType<typeof prismaClientSingleton>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
