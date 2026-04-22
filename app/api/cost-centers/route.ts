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

    const costCenters = await prisma.costCenter.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ costCenters });
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return NextResponse.json({ error: 'Erro ao buscar centros de custo' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    const costCenter = await prisma.costCenter.create({
      data: {
        name,
        description,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ costCenter }, { status: 201 });
  } catch (error) {
    console.error('Error creating cost center:', error);
    return NextResponse.json({ error: 'Erro ao criar centro de custo' }, { status: 500 });
  }
}
