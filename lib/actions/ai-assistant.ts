'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { aiChatRequestSchema } from '@/lib/schemas/ai-assistant';
import {
  buildChatPrompt,
  buildFinancialContext,
  callGemini,
  findOwnConversation,
  getGeminiConfig,
  getWorkspaceTimeoutMs,
  saveConversationTurn,
} from '@/lib/services/ai-assistant';
import { type AIMessage, type ChatResponse } from '@/types/ai';
import { revalidatePath } from 'next/cache';

/**
 * Versão sem streaming do chat (a tela usa `POST /api/ai-assistant/chat`, que
 * transmite token a token). Mantida para chamadas internas.
 */
export async function chatWithAI(message: string, conversationId?: string): Promise<ChatResponse> {
  try {
    const session = await requirePermission('ai-assistant', 'CREATE');
    const { workspaceId, id: userId } = session.user;
    const parsed = aiChatRequestSchema.parse({ message, conversationId });

    const gemini = getGeminiConfig();
    if (!gemini) {
      return {
        success: false,
        error:
          'API key do Gemini não configurada. Configure a variável de ambiente GEMINI_API_KEY.',
      };
    }

    // Conversa sempre no escopo do workspace + usuário; consultas independentes em paralelo.
    const [conversation, context, timeoutMs] = await Promise.all([
      parsed.conversationId
        ? findOwnConversation(parsed.conversationId, workspaceId, userId)
        : null,
      buildFinancialContext(workspaceId),
      getWorkspaceTimeoutMs(workspaceId),
    ]);
    if (parsed.conversationId && !conversation) {
      return { success: false, error: 'Conversa não encontrada' };
    }

    const history: AIMessage[] = (conversation?.messages as unknown as AIMessage[]) || [];
    const aiResponse = await callGemini(buildChatPrompt(context, history, parsed.message), {
      ...gemini,
      timeoutMs,
    });

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: parsed.message,
      timestamp: new Date().toISOString(),
    };
    const assistantMessage: AIMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    const savedId = await saveConversationTurn({
      workspaceId,
      userId,
      conversationId: conversation?.id ?? null,
      history,
      userMessage,
      assistantMessage,
      title: conversation?.title,
    });

    return { success: true, message: assistantMessage, conversationId: savedId };
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar mensagem',
    };
  }
}

export async function createConversation(
  title?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requirePermission('ai-assistant', 'CREATE');

    const conversation = await prisma.aIConversation.create({
      data: {
        title: title || `Nova Conversa ${new Date().toLocaleDateString('pt-BR')}`,
        messages: [],
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });

    return { success: true, id: conversation.id };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: 'Erro ao criar conversa' };
  }
}

export async function getConversations(): Promise<
  { id: string; title: string; createdAt: Date; updatedAt: Date; messageCount: number }[]
> {
  try {
    const session = await requirePermission('ai-assistant', 'VIEW');

    const conversations = await prisma.aIConversation.findMany({
      where: { workspaceId: session.user.workspaceId, userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    await cleanupOldConversations(session.user.workspaceId, session.user.id);

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: (c.messages as unknown as AIMessage[]).length,
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

export async function getConversation(id: string): Promise<AIMessage[] | null> {
  try {
    const session = await requirePermission('ai-assistant', 'VIEW');

    const conversation = await prisma.aIConversation.findFirst({
      where: { id, workspaceId: session.user.workspaceId, userId: session.user.id },
    });

    if (!conversation) return null;

    return (conversation.messages as unknown as AIMessage[]) || [];
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }
}

export async function deleteConversation(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requirePermission('ai-assistant', 'DELETE');

    await prisma.aIConversation.delete({
      where: { id, workspaceId: session.user.workspaceId, userId: session.user.id },
    });

    revalidatePath('/ai-assistant');
    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: 'Erro ao excluir conversa' };
  }
}

async function cleanupOldConversations(workspaceId: string, userId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  await prisma.aIConversation.deleteMany({
    where: {
      workspaceId,
      userId,
      updatedAt: { lt: ninetyDaysAgo },
    },
  });

  const count = await prisma.aIConversation.count({
    where: { workspaceId, userId },
  });

  if (count > 50) {
    const toDelete = await prisma.aIConversation.findMany({
      where: { workspaceId, userId },
      orderBy: { updatedAt: 'asc' },
      take: count - 50,
      select: { id: true },
    });

    await prisma.aIConversation.deleteMany({
      where: { id: { in: toDelete.map((c) => c.id) } },
    });
  }
}
