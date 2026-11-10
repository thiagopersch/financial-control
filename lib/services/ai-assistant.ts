import { DEBT_OPEN_STATUSES } from '@/lib/constants/debt-status';
import { ExternalTimeoutError, resolveTimeoutMs } from '@/lib/http/fetch-with-timeout';
import prisma from '@/lib/prisma';
import type { AIMessage, FinancialContext } from '@/types/ai';
import { Prisma } from '@prisma/client';

/**
 * Regras do assistente financeiro (fora de `'use server'`): montagem do
 * contexto, do prompt e as chamadas ao Gemini — com e sem streaming.
 */

export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  return apiKey ? { apiKey, model } : null;
}

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

/** Contexto financeiro do workspace: todas as consultas em paralelo, só as colunas usadas. */
export async function buildFinancialContext(workspaceId: string): Promise<FinancialContext> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [accounts, creditCards, budgets, debts, goals, transactions, monthTotals, spentByCategory] =
    await Promise.all([
      prisma.account.findMany({ where: { workspaceId }, select: { name: true, type: true } }),
      prisma.creditCard.findMany({
        where: { account: { workspaceId } },
        select: {
          limit: true,
          dueDay: true,
          closingDay: true,
          account: { select: { name: true } },
          invoices: {
            where: { status: 'OPEN' },
            select: { amount: true, dueDate: true, month: true, year: true },
          },
        },
      }),
      prisma.budget.findMany({
        where: { workspaceId, month, year },
        select: { amount: true, categoryId: true, category: { select: { name: true } } },
      }),
      prisma.debt.findMany({
        where: { workspaceId, status: { in: DEBT_OPEN_STATUSES } },
        select: { name: true, currentValue: true, minimumPayment: true, interestRate: true },
      }),
      prisma.goal.findMany({
        where: { workspaceId, isActive: true },
        select: { name: true, targetAmount: true, currentAmount: true, deadline: true },
      }),
      prisma.transaction.findMany({
        where: { workspaceId, date: { gte: thirtyDaysAgo } },
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
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          workspaceId,
          type: { in: ['INCOME', 'EXPENSE'] },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // Gasto por categoria numa query agrupada (antes: um aggregate por orçamento).
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { workspaceId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

  const spentMap = new Map(spentByCategory.map((g) => [g.categoryId, Number(g._sum.amount || 0)]));
  const sumOf = (type: string) =>
    Number(monthTotals.find((g) => g.type === type)?._sum.amount || 0);
  const income = sumOf('INCOME');
  const expenses = sumOf('EXPENSE');

  return {
    accounts: accounts.map((a) => ({ name: a.name, type: a.type })),
    creditCards: creditCards.map((card) => {
      const totalInvoice = card.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const nextInvoice = card.invoices.find((inv) => inv.month === month && inv.year === year);
      return {
        name: card.account.name,
        limit: Number(card.limit),
        currentBalance: totalInvoice,
        dueDate: nextInvoice ? nextInvoice.dueDate?.getDate() || card.dueDay : card.dueDay,
        closingDate: card.closingDay,
      };
    }),
    budgets: budgets.map((budget) => {
      const spent = spentMap.get(budget.categoryId) ?? 0;
      return {
        category: budget.category.name,
        amount: Number(budget.amount),
        spent,
        percentage: (spent / Number(budget.amount)) * 100,
      };
    }),
    debts: debts.map((d) => ({
      name: d.name,
      totalAmount: 0,
      remainingAmount: Number(d.currentValue),
      monthlyPayment: Number(d.minimumPayment),
      interestRate: Number(d.interestRate || 0),
    })),
    goals: goals
      .filter((g) => g.deadline)
      .map((g) => ({
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        deadline: g.deadline!.toISOString(),
        percentage: (Number(g.currentAmount) / Number(g.targetAmount)) * 100,
      })),
    monthlySummary: { income, expenses, balance: income - expenses },
    recentTransactions: transactions.map((t) => ({
      date: t.date.toISOString(),
      description: t.description || '',
      amount: Number(t.amount),
      type: t.type as 'INCOME' | 'EXPENSE',
      category: t.category.name,
    })),
    cashFlowProjection: { next30Days: { income, expenses } },
  };
}

export function buildChatPrompt(
  context: FinancialContext,
  history: AIMessage[],
  message: string,
): string {
  const conversationHistory = history
    .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n\n');

  return `${buildSystemPrompt(context)}

## Histórico da Conversa
${conversationHistory || 'Nenhuma mensagem anterior'}

## Nova Mensagem do Usuário
Usuário: ${message}

Responda em português brasileiro.`;
}

const GENERATION_CONFIG = { temperature: 0.7, maxOutputTokens: 2048, topP: 0.9, topK: 40 };

export interface GeminiCallOptions {
  apiKey: string;
  model: string;
  /** Tempo máximo até a primeira resposta e entre dois trechos do stream. */
  timeoutMs?: number | null;
  signal?: AbortSignal;
}

/**
 * Chama `:streamGenerateContent?alt=sse` e devolve o texto conforme o modelo
 * gera (token a token). O timeout do workspace vale para a resposta inicial e
 * para cada pausa entre trechos — uma resposta longa que continua chegando não
 * é cortada.
 */
export async function* streamGemini(
  prompt: string,
  { apiKey, model, timeoutMs, signal }: GeminiCallOptions,
): AsyncGenerator<string> {
  const limit = resolveTimeoutMs(timeoutMs);
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, limit);
  };
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    arm();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        // Chave no header (não na URL, onde acabaria em logs).
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: GENERATION_CONFIG,
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok || !response.body) {
      throw new Error(`Gemini API error (${response.status}): ${await response.text()}`);
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    while (true) {
      arm();
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      // Eventos SSE separados por linha em branco; cada um traz `data: {json}`.
      let boundary: number;
      while ((boundary = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary).replace(/^\r?\n\r?\n/, '');
        for (const line of event.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue;
          const text = extractText(line.slice(5).trim());
          if (text) yield text;
        }
      }
    }
  } catch (error) {
    if (timedOut) throw new ExternalTimeoutError('generativelanguage.googleapis.com', limit);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

function extractText(json: string): string {
  try {
    const data = JSON.parse(json);
    return (
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
      ''
    );
  } catch {
    return '';
  }
}

/** Resposta completa (sem streaming), montada a partir do stream. */
export async function callGemini(prompt: string, options: GeminiCallOptions): Promise<string> {
  let text = '';
  for await (const chunk of streamGemini(prompt, options)) text += chunk;
  return text || 'Desculpe, não consegui processar sua solicitação.';
}

export function newConversationTitle() {
  return `Conversa ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
}

/** Grava a troca de mensagens, sempre no escopo do workspace + usuário. */
export async function saveConversationTurn(input: {
  workspaceId: string;
  userId: string;
  conversationId: string | null;
  history: AIMessage[];
  userMessage: AIMessage;
  assistantMessage: AIMessage;
  title?: string | null;
}) {
  const messages = [
    ...input.history,
    input.userMessage,
    input.assistantMessage,
  ] as unknown as Prisma.InputJsonValue;
  const title = input.title || newConversationTitle();

  if (input.conversationId) {
    const updated = await prisma.aIConversation.updateMany({
      where: { id: input.conversationId, workspaceId: input.workspaceId, userId: input.userId },
      data: { messages, title, updatedAt: new Date() },
    });
    if (updated.count > 0) return input.conversationId;
  }

  const created = await prisma.aIConversation.create({
    data: { title, messages, workspaceId: input.workspaceId, userId: input.userId },
    select: { id: true },
  });
  return created.id;
}

/** Conversa do próprio usuário (escopo workspace + usuário), ou `null`. */
export function findOwnConversation(id: string, workspaceId: string, userId: string) {
  return prisma.aIConversation.findFirst({
    where: { id, workspaceId, userId },
    select: { id: true, title: true, messages: true },
  });
}

export async function getWorkspaceTimeoutMs(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { externalApiTimeoutMs: true },
  });
  return workspace?.externalApiTimeoutMs ?? null;
}
