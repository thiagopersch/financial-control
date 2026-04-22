'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/hooks/ai/use-ai-assistant';
import { Bot, Loader2, MessageSquare, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import { ChatMessage } from './components/chat-message';

const suggestionQuestions = [
  'Quanto gastei esse mês?',
  'Quais são minhas maiores despesas?',
  'Qual o meu saldo atual?',
  'Quanto devo gastar por categoria?',
  'Me dá um resumo financeiro do mês',
];

export default function AIAssistantPage() {
  const {
    input,
    setInput,
    isLoading,
    currentConversationId,
    scrollRef,
    conversations,
    isLoadingConversations,
    messages,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleSend,
  } = useAIAssistant();

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

      <div className="grid h-[calc(100vh-250px)] gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Conversas</CardTitle>
                <Button size="icon" variant="ghost" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100%-60px)] px-2">
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
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{conv.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(conv.updatedAt).toLocaleDateString('pt-BR')}
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
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chat
              </CardTitle>
              <CardDescription>
                {!currentConversationId
                  ? 'Crie uma nova conversa para começar'
                  : 'Pergunte sobre suas finanças'}
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
                      <ChatMessage
                        key={msg.id}
                        content={msg.content}
                        role={msg.role}
                        timestamp={msg.timestamp}
                      />
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
