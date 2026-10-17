import { ForbiddenError, requirePermission } from '@/lib/permissions/require-permission';
import { listScheduledEmailLogs } from '@/lib/queries/scheduled-emails';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('scheduled', 'VIEW');
    const { id } = await params;
    const search = request.nextUrl.searchParams;
    const page = Math.max(Number(search.get('page')) || 1, 1);
    const pageSize = Math.min(Math.max(Number(search.get('pageSize')) || 20, 1), 100);

    return NextResponse.json(
      await listScheduledEmailLogs(session.user.workspaceId, id, { page, pageSize }),
    );
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching scheduled email logs:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
  }
}
