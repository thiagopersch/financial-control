import * as z from 'zod';

/** Corpo do POST /api/ai-assistant/chat (validado no client e no servidor). */
export const aiChatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Digite uma mensagem').max(4000, 'Mensagem muito longa'),
  conversationId: z.string().min(1).optional().nullable(),
});

export type AIChatRequest = z.infer<typeof aiChatRequestSchema>;

/** Linha que sinaliza erro dentro do stream de texto da IA. */
export const AI_STREAM_ERROR_PREFIX = '\u0000AI_ERROR:';
