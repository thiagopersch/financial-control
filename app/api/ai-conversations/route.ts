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

    const { page, pageSize, skip, take } = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 50,
    });

    // Conta as mensagens no banco (jsonb_array_length) em vez de trazer o JSON
    // inteiro de cada conversa só para medir o tamanho.
    const [conversations, total] = await Promise.all([
      prisma.$queryRaw<
        { id: string; title: string; createdAt: Date; updatedAt: Date; messageCount: number }[]
      >`
        SELECT "id", "title", "createdAt", "updatedAt",
          CASE WHEN jsonb_typeof("messages") = 'array'
            THEN jsonb_array_length("messages") ELSE 0 END::int AS "messageCount"
        FROM "AIConversation"
        WHERE "workspaceId" = ${session.user.workspaceId} AND "userId" = ${session.user.id}
        ORDER BY "updatedAt" DESC
        LIMIT ${take} OFFSET ${skip}
      `,
      prisma.aIConversation.count({
        where: { workspaceId: session.user.workspaceId, userId: session.user.id },
      }),
    ]);

    const conversationsList = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messageCount: c.messageCount,
    }));

    return NextResponse.json({
      conversations: conversationsList,
      pagination: paginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    const conversation = await prisma.aIConversation.create({
      data: {
        title: title || `Nova Conversa ${new Date().toLocaleDateString('pt-BR')}`,
        messages: [],
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          messageCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
  }
}
