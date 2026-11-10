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

    const account = await prisma.account.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'Erro ao buscar conta' }, { status: 500 });
  }
}
