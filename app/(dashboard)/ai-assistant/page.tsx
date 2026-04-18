"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI, createConversation, deleteConversation } from "@/lib/actions/ai-assistant";
import type { AIMessage } from "@/types/ai";
import { Bot, Loader2, MessageSquare, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const suggestionQuestions = [
  "Quanto gastei esse mês?",
  "Quais são minhas maiores despesas?",
  "Qual o meu saldo atual?",
  "Quanto devo gastar por categoria?",
  "Me dá um resumo financeiro do mês",
];

export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<AIMessage[]>([]);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  console.log({ currentConversationId });
  console.log({ isNewConversation });

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    mutate: refreshConversations,
  } = useSWR<{ conversations: ConversationListItem[] }>("/api/ai-conversations", fetcher, {
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

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewConversation = async () => {
    try {
      const result = await createConversation();
      if (result.success && result.id) {
        setCurrentConversationId(result.id);
        setLocalMessages([]);
        setIsNewConversation(true);
        refreshConversations();
        toast.success("Nova conversa criada");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erro ao criar conversa");
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setLocalMessages([]);
    setIsNewConversation(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
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
        toast.success("Conversa excluída");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Erro ao excluir conversa");
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInput("");
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
        toast.error(result.error || "Erro ao processar mensagem");
        setLocalMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setInput(input);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao processar mensagem");
      setLocalMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(input);
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    currentConversationId,
    isNewConversation,
    refreshConversations,
    refreshMessages,
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assistente Financeiro IA</h1>
          <p className="text-muted-foreground">
            Converse sobre suas finanças com IA integrada ao Gemini
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Conversas</CardTitle>
                <Button size="icon" variant="ghost" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px] px-2">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                    <p className="text-muted-foreground text-sm">Nenhuma conversa ainda</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={handleNewConversation}
                    >
                      Iniciar conversa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors ${
                          currentConversationId === conv.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{conv.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(conv.updatedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="flex h-[600px] max-h-[600px] flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chat
              </CardTitle>
              <CardDescription>
                {!currentConversationId
                  ? "Crie uma nova conversa para começar"
                  : "Pergunte sobre suas finanças"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              <ScrollArea className="min-h-0 flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {!currentConversationId && messages.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bot className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground mb-4">
                        Como posso ajudar com suas finanças hoje?
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestionQuestions.map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleNewConversation().then(() => setInput(q));
                            }}
                            disabled={isLoading}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : messages.length === 0 && !isLoading ? (
                    <div className="py-8 text-center">
                      <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground mb-4">
                        Conversa vazia. Envie uma mensagem para começar.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`mt-1 text-xs ${
                              msg.role === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Pensando...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Sugestões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestionQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className="h-auto w-full justify-start py-2 text-left"
                  onClick={() => {
                    if (!currentConversationId) {
                      handleNewConversation().then(() => {
                        setTimeout(() => setInput(q), 100);
                      });
                    } else {
                      setInput(q);
                    }
                  }}
                  disabled={isLoading}
                >
                  <span className="text-sm">{q}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
