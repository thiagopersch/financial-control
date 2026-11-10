import { logger } from '@/lib/logger';
import { ExternalTimeoutError } from '@/lib/http/fetch-with-timeout';
import { ForbiddenError, requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { AI_STREAM_ERROR_PREFIX, aiChatRequestSchema } from '@/lib/schemas/ai-assistant';
import {
  buildChatPrompt,
  buildFinancialContext,
  findOwnConversation,
  getGeminiConfig,
  getWorkspaceTimeoutMs,
  newConversationTitle,
  saveConversationTurn,
  streamGemini,
} from '@/lib/services/ai-assistant';
import type { AIMessage } from '@/types/ai';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Chat com a IA transmitido token a token (text/plain em chunks).
 *
 * É uma API Route (e não Server Action) porque Server Actions não fazem
 * streaming de resposta incremental. O id da conversa vai no header
 * `X-Conversation-Id`; um erro no meio do stream chega como uma linha
 * iniciada por `AI_STREAM_ERROR_PREFIX`.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('ai-assistant', 'CREATE');
    const { workspaceId, id: userId } = session.user;
    const { message, conversationId } = aiChatRequestSchema.parse(await request.json());

    const gemini = getGeminiConfig();
    if (!gemini) {
      return NextResponse.json(
        { error: 'API key do Gemini não configurada. Configure a variável GEMINI_API_KEY.' },
        { status: 503 },
      );
    }

    const [existing, context, timeoutMs] = await Promise.all([
      conversationId ? findOwnConversation(conversationId, workspaceId, userId) : null,
      buildFinancialContext(workspaceId),
      getWorkspaceTimeoutMs(workspaceId),
    ]);
    if (conversationId && !existing) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Conversa nova é criada antes do stream para o id seguir no header.
    const conversation =
      existing ??
      (await prisma.aIConversation.create({
        data: { title: newConversationTitle(), messages: [], workspaceId, userId },
        select: { id: true, title: true, messages: true },
      }));
    const history = (conversation.messages as unknown as AIMessage[]) || [];
    const prompt = buildChatPrompt(context, history, message);
    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let answer = '';
        try {
          for await (const chunk of streamGemini(prompt, {
            ...gemini,
            timeoutMs,
            signal: request.signal,
          })) {
            answer += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          await saveConversationTurn({
            workspaceId,
            userId,
            conversationId: conversation.id,
            history,
            userMessage,
            assistantMessage: {
              id: `msg_${Date.now()}_assistant`,
              role: 'assistant',
              content: answer || 'Desculpe, não consegui processar sua solicitação.',
              timestamp: new Date().toISOString(),
            },
            title: conversation.title,
          });
        } catch (error) {
          if (!request.signal.aborted) {
            logger.error('ai.stream_failed', { conversationId: conversation.id, error });
            const reason =
              error instanceof ExternalTimeoutError
                ? 'A IA demorou demais para responder. Tente novamente.'
                : 'Erro ao processar mensagem';
            controller.enqueue(encoder.encode(`\n${AI_STREAM_ERROR_PREFIX}${reason}`));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Conversation-Id': conversation.id,
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 },
      );
    }
    logger.error('ai.chat_failed', { error });
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 });
  }
}
