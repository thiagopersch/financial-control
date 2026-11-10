import { tryAcquireLock } from '@/lib/cache/redis';
import type { JobName, JobPayload } from '@/lib/jobs/registry';
import { logger } from '@/lib/logger';
import { Client } from '@upstash/qstash';
import { after } from 'next/server';

/**
 * Fila de tarefas lentas (e-mail, WhatsApp, alertas, agendamentos).
 *
 * - Com `QSTASH_TOKEN`: publica no Upstash QStash, que chama
 *   `POST {APP_URL}/api/jobs/{job}` com retries e assinatura — o request do
 *   usuário responde na hora e o trabalho roda em outra invocação.
 * - Sem `QSTASH_TOKEN` (dev local): roda o job com `after()`, depois da
 *   resposta, no mesmo processo.
 */

let client: Client | null | undefined;

function getQStash(): Client | null {
  if (client !== undefined) return client;
  const token = process.env.QSTASH_TOKEN;
  client = token
    ? new Client({ token, ...(process.env.QSTASH_URL ? { baseUrl: process.env.QSTASH_URL } : {}) })
    : null;
  return client;
}

export function appBaseUrl(): string {
  const explicit = process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export interface EnqueueOptions {
  /** Atraso antes de executar (segundos). */
  delaySec?: number;
  /** Mesma chave dentro da janela de deduplicação do QStash = um único job. */
  deduplicationId?: string;
}

export async function enqueue<N extends JobName>(
  name: N,
  payload: JobPayload<N>,
  options: EnqueueOptions = {},
): Promise<{ queued: boolean }> {
  const qstash = getQStash();
  if (qstash) {
    try {
      await qstash.publishJSON({
        url: `${appBaseUrl()}/api/jobs/${name}`,
        body: payload,
        retries: 3,
        ...(options.delaySec ? { delay: options.delaySec } : {}),
        ...(options.deduplicationId ? { deduplicationId: options.deduplicationId } : {}),
      });
      return { queued: true };
    } catch (error) {
      // Fila indisponível não pode perder o trabalho: cai para execução local.
      logger.error('queue.publish_failed', { job: name, error });
    }
  }

  runAfterResponse(name, payload);
  return { queued: false };
}

/**
 * Enfileira no máximo uma vez a cada `windowSec` para a mesma chave (lock no
 * Redis). Usado por gatilhos frequentes, como a navegação no dashboard.
 */
export async function enqueueThrottled<N extends JobName>(
  lockKey: string,
  windowSec: number,
  name: N,
  payload: JobPayload<N>,
) {
  if (!(await tryAcquireLock(`job:${lockKey}`, windowSec))) return { queued: false, skipped: true };
  return { ...(await enqueue(name, payload)), skipped: false };
}

function runAfterResponse<N extends JobName>(name: N, payload: JobPayload<N>) {
  const task = async () => {
    try {
      const { runJob } = await import('@/lib/jobs/registry');
      await runJob(name, payload);
    } catch (error) {
      logger.error('queue.local_job_failed', { job: name, error });
    }
  };
  try {
    after(task);
  } catch {
    // Fora do escopo de um request (ex.: dentro de outro job): roda direto.
    void task();
  }
}
