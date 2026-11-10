import { isJobName, runJob } from '@/lib/jobs/registry';
import { logger } from '@/lib/logger';
import { Receiver } from '@upstash/qstash';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Relatórios por e-mail e varreduras de agendamentos podem levar alguns segundos. */
export const maxDuration = 300;

/**
 * Endpoint chamado pelo Upstash QStash para executar um job da fila
 * (`lib/queue`). Só aceita requisições assinadas pelo QStash; erros devolvem
 * 5xx para o QStash reprocessar (com backoff), payload inválido devolve 400.
 */
async function isSignedByQStash(request: NextRequest, body: string): Promise<boolean> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) return false;

  const signature = request.headers.get('upstash-signature');
  if (!signature) return false;

  try {
    return await new Receiver({ currentSigningKey, nextSigningKey }).verify({ signature, body });
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  const body = await request.text();

  if (!(await isSignedByQStash(request, body))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (!isJobName(job)) {
    return NextResponse.json({ error: 'Job desconhecido' }, { status: 404 });
  }

  const startedAt = Date.now();
  try {
    const result = await runJob(job, body ? JSON.parse(body) : {});
    logger.info('job.completed', { job, durationMs: Date.now() - startedAt });
    return NextResponse.json({ ok: true, result: result ?? null });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      logger.warn('job.invalid_payload', { job, error });
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }
    logger.error('job.failed', { job, durationMs: Date.now() - startedAt, error });
    return NextResponse.json({ error: 'Falha ao executar o job' }, { status: 500 });
  }
}
