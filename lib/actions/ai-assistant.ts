'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { type AIMessage, type ChatResponse, type FinancialContext } from '@/types/ai';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

function buildSystemPrompt(context: FinancialContext): string {
  const contextJson = JSON.stringify(context, null, 2);

  return `Você é um assistente financeiro virtual especialista, desenvolvido para ajudar o usuário a gerenciar suas finanças pessoais.

## Instruções de Comportamento
- Responda SEMPRE em português brasileiro de forma clara, objetiva e profissional
- Use formatação markdown para melhorar a legibilidade
- Quando apropriado, sugira ações práticas (criar transação, configurar alerta, definir meta, etc)
- Seja proativo em identificar oportunidades de economia ou investimento
- Nunca exponha dados sensíveis ou informações confidenciais

## Dados Financeiros do Usuário

${contextJson}

## Diretrizes de Resposta
- Analise os dados fornecidos para fundamentar suas respostas
- Destaque insights relevantes sobre padrões de gastos
- Sugira melhorias na gestão financeira quando identificado
- Responda de forma conversacional, como um consultor financeiro

Contexto financeiro atualizado em: ${new Date().toLocaleString('pt-BR')}`;
}

async function buildFinancialContext(workspaceId: string): Promise<FinancialContext> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [accounts, creditCards, budgets, debts, goals, transactions] = await Promise.all([
    prisma.account.findMany({
      where: { workspaceId },
      select: { name: true, type: true },
    }),
    prisma.creditCard.findMany({
      where: { account: { workspaceId } },
      include: {
        account: { select: { name: true } },
        invoices: {
          where: { status: 'OPEN' },
          select: { amount: true, dueDate: true, month: true, year: true },
        },
      },
    }),
    prisma.budget.findMany({
      where: { workspaceId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { category: { select: { name: true } } },
    }),
    prisma.debt.findMany({
      where: { workspaceId, isActive: true },
      select: {
        name: true,
        currentValue: true,
        minimumPayment: true,
        interestRate: true,
      },
    }),
    prisma.goal.findMany({
      where: { workspaceId, isActive: true },
      select: { name: true, targetAmount: true, currentAmount: true, deadline: true },
    }),
    prisma.transaction.findMany({
      where: {
        workspaceId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
      take: 50,
      select: {
        date: true,
        description: true,
        amount: true,
        type: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const accountBalances = accounts.map((a) => ({
    name: a.name,
    type: a.type,
  }));

  const cardData = creditCards.map((card) => {
    const totalInvoice = card.invoices.reduce((sum: number, inv) => sum + Number(inv.amount), 0);
    const nextInvoice = card.invoices.find(
      (inv) => inv.month === now.getMonth() + 1 && inv.year === now.getFullYear(),
    );
    return {
      name: card.account.name,
      limit: Number(card.limit),
      currentBalance: totalInvoice,
      dueDate: nextInvoice ? nextInvoice.dueDate?.getDate() || card.dueDay : card.dueDay,
      closingDate: card.closingDay,
    };
  });

  const budgetData = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          workspaceId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      });
      const spentAmount = Number(spent._sum.amount || 0);
      const percentage = (spentAmount / Number(budget.amount)) * 100;
      return {
        category: budget.category.name,
        amount: Number(budget.amount),
        spent: spentAmount,
        percentage,
      };
    }),
  );

  const debtData = debts.map((d) => ({
    name: d.name,
    totalAmount: 0,
    remainingAmount: Number(d.currentValue),
    monthlyPayment: Number(d.minimumPayment),
    interestRate: Number(d.interestRate || 0),
  }));

  const goalData = goals
    .filter((g) => g.deadline)
    .map((g) => ({
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline!.toISOString(),
      percentage: (Number(g.currentAmount) / Number(g.targetAmount)) * 100,
    }));

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { workspaceId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { workspaceId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount || 0);
  const expenses = Number(expenseAgg._sum.amount || 0);

  const recentTx = transactions.map((t) => ({
    date: t.date.toISOString(),
    description: t.description || '',
    amount: Number(t.amount),
    type: t.type as 'INCOME' | 'EXPENSE',
    category: t.category.name,
  }));

  return {
    accounts: accountBalances,
    creditCards: cardData,
    budgets: budgetData,
    debts: debtData,
    goals: goalData,
    monthlySummary: { income, expenses, balance: income - expenses },
    recentTransactions: recentTx,
    cashFlowProjection: { next30Days: { income, expenses } },
  };
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Desculpe, não consegui processar sua solicitação.'
  );
}

export async function chatWithAI(message: string, conversationId?: string): Promise<ChatResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: 'Não autorizado' };

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return {
        success: false,
        error:
          'API key do Gemini não configurada. Configure a variável de ambiente GEMINI_API_KEY.',
      };
    }

    let conversation = conversationId
      ? await prisma.aIConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (conversationId && !conversation) {
      return { success: false, error: 'Conversa não encontrada' };
    }

    const context = await buildFinancialContext(session.user.workspaceId);

    const existingMessages: AIMessage[] = (conversation?.messages as unknown as AIMessage[]) || [];

    const systemPrompt = buildSystemPrompt(context);

    const conversationHistory = existingMessages
      .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = `${systemPrompt}

## Histórico da Conversa
${conversationHistory || 'Nenhuma mensagem anterior'}

## Nova Mensagem do Usuário
Usuário: ${message}

Responda em português brasileiro.`;

    const aiResponse = await callGemini(fullPrompt, apiKey, model);

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: AIMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...existingMessages, userMessage, assistantMessage];

    const newConversationTitle =
      conversation?.title ||
      `Conversa ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;

    if (conversation) {
      conversation = await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: {
          messages: updatedMessages as unknown as any,
          title: newConversationTitle,
          updatedAt: new Date(),
        },
      });
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          title: newConversationTitle,
          messages: updatedMessages as unknown as any,
          workspaceId: session.user.workspaceId,
          userId: session.user.id,
        },
      });
    }

    return {
      success: true,
      message: assistantMessage,
      conversationId: conversation.id,
    };
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
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: 'Não autorizado' };

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
    const session = await getServerSession(authOptions);
    if (!session) return [];

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
    const session = await getServerSession(authOptions);
    if (!session) return null;

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
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: 'Não autorizado' };

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
