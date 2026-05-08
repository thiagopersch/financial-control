import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const tags = await prisma.tag.findMany({
      where: { workspaceId: session.user.workspaceId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar tags' }, { status: 500 });
  }
}
