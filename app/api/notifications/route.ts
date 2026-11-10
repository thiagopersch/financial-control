import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    // Teto de 100 por página (antes `limit` não tinha limite).
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100);
    const offset = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          workspaceId: session.user.workspaceId,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          workspaceId: session.user.workspaceId,
        },
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          workspaceId: session.user.workspaceId,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, level, link, metadata, userId } = body;

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        level: level || 'INFO',
        link,
        metadata,
        userId: userId || session.user.id,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 });
  }
}
