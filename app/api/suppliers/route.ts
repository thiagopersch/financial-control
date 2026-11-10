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
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      suppliers: items,
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
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
    const { name, document, contact, address } = body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        document: document || null,
        contact: contact || null,
        address: address || null,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 });
  }
}
