import { processDueScheduledEmails } from '@/lib/services/scheduled-email-runner';
import { timingSafeEqual } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Triggered by an external scheduler (crontab, Vercel Cron, cron-job.org…)
 * every few minutes with `Authorization: Bearer $CRON_SECRET`. Sends every
 * scheduled e-mail whose nextRun is due.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const summary = await processDueScheduledEmails();
  return NextResponse.json(summary);
}

export const GET = handle;
export const POST = handle;
