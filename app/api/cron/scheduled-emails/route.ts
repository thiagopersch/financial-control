import { processDueScheduledEmails } from '@/lib/services/scheduled-email-runner';
import { processDueScheduledTransactions } from '@/lib/services/scheduled-transactions';
import { timingSafeEqual } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Triggered by Vercel Cron (`vercel.json`) or any external scheduler with
 * `Authorization: Bearer $CRON_SECRET`. Generates due scheduled transactions
 * and claims every scheduled e-mail whose nextRun is due — each e-mail is then
 * sent by its own queue job (`scheduled-emails.run`).
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
  const [transactions, emails] = await Promise.all([
    processDueScheduledTransactions(),
    processDueScheduledEmails(),
  ]);
  return NextResponse.json({ transactions, emails });
}

export const GET = handle;
export const POST = handle;
