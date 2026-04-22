'use client';

import { chatWithAI, createConversation, deleteConversation } from '@/lib/actions/ai-assistant';
import { showError, showSuccess } from '@/lib/utils/toast';
import type { AIMessage } from '@/types/ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  const messages = isNewConversation || !currentConversationId ? localMessages : fetchedMessages;

  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

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
    } catch (error) {
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

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithAI(input, currentConversationId || undefined);

      if (result.success && result.message && result.conversationId) {
        const assistantMessage = result.message;
        setLocalMessages((prev) => [...prev, assistantMessage]);

        if (!currentConversationId) {
          setCurrentConversationId(result.conversationId);
        }

        setIsNewConversation(false);
        refreshConversations();
        if (result.conversationId) {
          refreshMessages();
        }
      } else {
        showError(result.error || 'Erro ao processar mensagem');
        setLocalMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setInput(input);
      }
    } catch {
      showError('Erro ao processar mensagem');
      setLocalMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(input);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentConversationId, refreshConversations, refreshMessages]);

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
  };
}
