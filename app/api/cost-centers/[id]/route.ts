import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const costCenter = await prisma.costCenter.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!costCenter) {
      return NextResponse.json({ error: 'Centro de custo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ costCenter });
  } catch (error) {
    console.error('Error fetching cost center:', error);
    return NextResponse.json({ error: 'Erro ao buscar centro de custo' }, { status: 500 });
  }
}
