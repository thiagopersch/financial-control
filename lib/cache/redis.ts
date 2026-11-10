import { Redis } from '@upstash/redis';
import { deserialize, serialize } from '@/lib/cache/serializer';
import { logger } from '@/lib/logger';

/**
 * Cache Redis (Upstash, via REST — funciona em serverless/Fluid compute).
 *
 * Sem `UPSTASH_REDIS_REST_URL`/`KV_REST_API_URL` configurado o cache vira
 * no-op: dev local e testes rodam direto no banco, sem mudar comportamento.
 * Falhas do Redis nunca derrubam o request — caem para a função original.
 */

const KEY_PREFIX = 'fc:';

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token, automaticDeserialization: false }) : null;
  return client;
}

/** Só para testes: troca o cliente (ou desliga com `null`). */
export function __setRedisForTests(next: Redis | null | undefined) {
  client = next;
}

function fullKey(key: string) {
  return KEY_PREFIX + key;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(fullKey(key));
    return raw == null ? null : deserialize<T>(raw);
  } catch (error) {
    logger.warn('cache.get_failed', { key, error });
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(fullKey(key), serialize(value), { ex: ttlSec });
  } catch (error) {
    logger.warn('cache.set_failed', { key, error });
  }
}

/** Cache-aside: devolve do Redis ou executa `fn` e grava o resultado com TTL. */
export async function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fn();
  if (value !== undefined && value !== null) await cacheSet(key, value, ttlSec);
  return value;
}

export async function invalidate(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys.map(fullKey));
  } catch (error) {
    logger.warn('cache.invalidate_failed', { keys, error });
  }
}

// ---------------------------------------------------------------------------
// Chaves versionadas por workspace: invalidar um escopo inteiro (ex.: todas as
// leituras derivadas de transações) é um único INCR, sem SCAN/DEL em massa —
// as chaves antigas simplesmente expiram pelo TTL.
// ---------------------------------------------------------------------------

export type WorkspaceCacheScope =
  | 'tx'
  | 'accounts'
  | 'categories'
  | 'suppliers'
  | 'payment-methods'
  | 'cost-centers'
  | 'credit-cards'
  | 'budgets'
  | 'debts'
  | 'goals';

function versionKey(workspaceId: string, scope: WorkspaceCacheScope) {
  return `ws:${workspaceId}:${scope}:ver`;
}

async function getWorkspaceVersion(workspaceId: string, scope: WorkspaceCacheScope) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string | number>(fullKey(versionKey(workspaceId, scope)));
    return raw == null ? 0 : Number(raw);
  } catch (error) {
    logger.warn('cache.version_failed', { workspaceId, scope, error });
    return null;
  }
}

/**
 * Cache de leituras de um workspace. `scopes` lista os escopos dos quais o
 * resultado depende; qualquer `bumpWorkspaceVersion` em um deles invalida.
 */
export async function cachedForWorkspace<T>(
  workspaceId: string,
  scopes: WorkspaceCacheScope | WorkspaceCacheScope[],
  keyParts: (string | number | null | undefined)[],
  ttlSec: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (!getRedis()) return fn();
  const list = Array.isArray(scopes) ? scopes : [scopes];
  const versions = await Promise.all(list.map((scope) => getWorkspaceVersion(workspaceId, scope)));
  if (versions.some((v) => v === null)) return fn();
  const versionTag = list.map((scope, i) => `${scope}${versions[i]}`).join('.');
  const key = `ws:${workspaceId}:${versionTag}:${keyParts.map((p) => p ?? '').join(':')}`;
  return cached(key, ttlSec, fn);
}

export async function bumpWorkspaceVersion(
  workspaceId: string,
  ...scopes: WorkspaceCacheScope[]
): Promise<void> {
  const redis = getRedis();
  if (!redis || scopes.length === 0) return;
  try {
    const pipeline = redis.pipeline();
    for (const scope of scopes) pipeline.incr(fullKey(versionKey(workspaceId, scope)));
    await pipeline.exec();
  } catch (error) {
    logger.warn('cache.bump_failed', { workspaceId, scopes, error });
  }
}

/**
 * Lock distribuído simples (SET NX EX). Devolve `true` se este chamador
 * adquiriu o lock. Sem Redis, sempre `true` (instância única em dev).
 */
export async function tryAcquireLock(key: string, ttlSec: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;
  try {
    const result = await redis.set(fullKey(`lock:${key}`), '1', { nx: true, ex: ttlSec });
    return result === 'OK';
  } catch (error) {
    logger.warn('cache.lock_failed', { key, error });
    return true;
  }
}
