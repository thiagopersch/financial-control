import { ForbiddenError, requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { listScheduledEmails } from '@/lib/queries/scheduled-emails';
import { isSmtpConfigured } from '@/lib/services/notification-delivery';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('scheduled', 'VIEW');
    const params = request.nextUrl.searchParams;
    const page = Math.max(Number(params.get('page')) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.get('pageSize')) || 20, 1), 100);

    const [result, workspace] = await Promise.all([
      listScheduledEmails(session.user.workspaceId, { page, pageSize }),
      prisma.workspace.findUnique({ where: { id: session.user.workspaceId } }),
    ]);

    return NextResponse.json({ ...result, smtpConfigured: isSmtpConfigured(workspace) });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching scheduled emails:', error);
    return NextResponse.json({ error: 'Erro ao buscar agendamentos de e-mail' }, { status: 500 });
  }
}
