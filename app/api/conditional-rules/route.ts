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
      prisma.conditionalRule.findMany({
        where,
        orderBy: { priority: 'asc' },
        skip,
        take,
      }),
      prisma.conditionalRule.count({ where }),
    ]);

    return NextResponse.json({
      rules: items,
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
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
