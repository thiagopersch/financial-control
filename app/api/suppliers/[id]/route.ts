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

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 });
  }
}
