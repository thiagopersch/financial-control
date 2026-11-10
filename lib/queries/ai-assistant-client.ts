import { AI_STREAM_ERROR_PREFIX, type AIChatRequest } from '@/lib/schemas/ai-assistant';

export class AIStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIStreamError';
  }
}

export interface AIStreamChunk {
  /** Id da conversa (vem no header, antes do primeiro token). */
  conversationId: string;
  /** Trecho novo do texto da resposta. */
  delta: string;
}

/**
 * Envia a mensagem e devolve a resposta da IA token a token (async generator).
 * `signal` permite parar a geração no meio.
 */
export async function* streamChat(
  input: AIChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<AIStreamChunk> {
  const res = await fetch('/api/ai-assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new AIStreamError(body?.error ?? 'Erro ao processar mensagem');
  }

  const conversationId = res.headers.get('X-Conversation-Id') ?? input.conversationId ?? '';
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    const errorAt = value.indexOf(AI_STREAM_ERROR_PREFIX);
    if (errorAt !== -1) {
      const before = value.slice(0, errorAt).replace(/\n$/, '');
      if (before) yield { conversationId, delta: before };
      throw new AIStreamError(value.slice(errorAt + AI_STREAM_ERROR_PREFIX.length).trim());
    }
    yield { conversationId, delta: value };
  }
}
