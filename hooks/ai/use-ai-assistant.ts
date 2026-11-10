'use client';

import { createConversation, deleteConversation } from '@/lib/actions/ai-assistant';
import { AIStreamError, streamChat } from '@/lib/queries/ai-assistant-client';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { AIMessage } from '@/types/ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR, { mutate as mutateCache } from 'swr';

import { fetcher } from '@/lib/queries/fetcher';

export interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export function useAIAssistant() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<AIMessage[]>([]);
  const [isNewConversation, setIsNewConversation] = useState(false);
  /** Mensagem do usuário + resposta sendo transmitida, exibidas até o stream terminar. */
  const [pendingMessages, setPendingMessages] = useState<AIMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    mutate: refreshConversations,
  } = useSWR<{ conversations: ConversationListItem[] }>('/api/ai-conversations', fetcher, {
    revalidateOnFocus: false,
  });

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    mutate: refreshMessages,
  } = useSWR<{ messages: AIMessage[] }>(
    currentConversationId && !isNewConversation
      ? `/api/ai-conversations/${currentConversationId}`
      : null,
    currentConversationId && !isNewConversation ? fetcher : null,
    {
      revalidateOnFocus: false,
    },
  );

  const conversations = conversationsData?.conversations || [];
  const fetchedMessages = messagesData?.messages || [];
  const baseMessages =
    isNewConversation || !currentConversationId ? localMessages : fetchedMessages;
  const messages = pendingMessages.length ? [...baseMessages, ...pendingMessages] : baseMessages;

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    const viewport = el?.querySelector<HTMLElement>('[data-scroll-viewport]') ?? el;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Sai da página no meio de uma resposta: cancela o stream.
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleNewConversation = useCallback(async () => {
    try {
      const result = await createConversation();
      if (result.success && result.id) {
        setCurrentConversationId(result.id);
        setLocalMessages([]);
        setIsNewConversation(true);
        refreshConversations();
        showSuccess('Nova conversa criada');
      }
    } catch {
      showError('Erro ao criar conversa');
    }
  }, [refreshConversations]);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setLocalMessages([]);
    setIsNewConversation(false);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const result = await deleteConversation(id);
        if (result.success) {
          if (currentConversationId === id) {
            setCurrentConversationId(null);
            setLocalMessages([]);
            setIsNewConversation(false);
          }
          refreshConversations();
          showSuccess('Conversa excluída');
        }
      } catch {
        showError('Erro ao excluir conversa');
      }
    },
    [currentConversationId, refreshConversations],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const now = Date.now();
    const userMessage: AIMessage = {
      id: `msg_${now}_user`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    let assistantMessage: AIMessage = {
      id: `msg_${now}_assistant`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    // Otimista: a mensagem do usuário aparece na hora, a resposta vai sendo preenchida.
    setPendingMessages([userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let conversationId = currentConversationId;
    try {
      for await (const chunk of streamChat(
        { message: text, conversationId: currentConversationId },
        controller.signal,
      )) {
        conversationId = chunk.conversationId || conversationId;
        assistantMessage = { ...assistantMessage, content: assistantMessage.content + chunk.delta };
        setPendingMessages([userMessage, assistantMessage]);
      }

      if (conversationId) {
        // Preenche o cache da conversa com o resultado final: sem flicker nem refetch imediato.
        await mutateCache(
          `/api/ai-conversations/${conversationId}`,
          { messages: [...baseMessages, userMessage, assistantMessage] },
          { revalidate: false },
        );
        setCurrentConversationId(conversationId);
      }
      setIsNewConversation(false);
      setLocalMessages([]);
      setPendingMessages([]);
      refreshConversations();
    } catch (error) {
      if (controller.signal.aborted) {
        // Parado pelo usuário: mantém o que já chegou na tela.
        setPendingMessages([]);
        if (conversationId) setCurrentConversationId(conversationId);
        setIsNewConversation(false);
        refreshConversations();
        refreshMessages();
      } else {
        showError(error instanceof AIStreamError ? error.message : 'Erro ao processar mensagem');
        setPendingMessages([]);
        setInput(text);
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    currentConversationId,
    baseMessages,
    refreshConversations,
    refreshMessages,
  ]);

  return {
    input,
    setInput,
    isLoading,
    currentConversationId,
    setCurrentConversationId,
    localMessages,
    setLocalMessages,
    isNewConversation,
    setIsNewConversation,
    scrollRef,
    conversations,
    isLoadingConversations,
    messages,
    isLoadingMessages,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleSend,
    handleStop,
    /** Resposta da IA chegando (token a token). */
    isStreaming: isLoading && pendingMessages.some((m) => m.role === 'assistant' && m.content),
  };
}
