import useSWR from "swr";
import { chatWithAI, createConversation, deleteConversation } from "@/lib/actions/ai-assistant";
import type { AIMessage } from "@/types/ai";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR<ConversationListItem[]>(
    "/api/ai-conversations",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  return {
    conversations: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useConversation(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<AIMessage[]>(
    id ? `/api/ai-conversations/${id}` : null,
    id ? fetcher : null,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    messages: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useChat() {
  const sendMessage = async (message: string, conversationId?: string) => {
    const result = await chatWithAI(message, conversationId);
    return result;
  };

  return { sendMessage };
}

export function useCreateConversation() {
  const create = async (title?: string) => {
    const result = await createConversation(title);
    return result;
  };

  return { create };
}

export function useDeleteConversation() {
  const remove = async (id: string) => {
    const result = await deleteConversation(id);
    return result;
  };

  return { delete: remove };
}
