import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const rules = await prisma.conditionalRule.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, conditions, actions } = body;

    const rule = await prisma.conditionalRule.create({
      data: {
        name,
        description: description || null,
        conditions,
        actions,
        isActive: true,
        priority: 0,
        createdById: session.user.id,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 });
  }
}
