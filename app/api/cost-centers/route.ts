import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { paginationMeta, parsePagination } from '@/lib/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { page, pageSize, skip, take, q } = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 100,
    });
    const where = {
      workspaceId: session.user.workspaceId,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.costCenter.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.costCenter.count({ where }),
    ]);

    return NextResponse.json({
      costCenters: items,
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
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
