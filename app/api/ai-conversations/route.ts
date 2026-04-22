import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { type AIMessage } from '@/types/ai';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    });

    const conversationsList = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messageCount: (c.messages as unknown as AIMessage[])?.length || 0,
    }));

    return NextResponse.json({ conversations: conversationsList });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
