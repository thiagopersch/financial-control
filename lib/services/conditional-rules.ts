import prisma from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';

type RuleCondition = { type: string; value: string };
type RuleAction = { type: string; value: string };

type TransactionWithRelations = {
  id: string;
  amount: number;
  categoryId: string;
  description: string | null;
  notes: string | null;
  workspaceId: string;
  category: { id: string; name: string };
  tags: { id: string; name: string }[];
};

function evaluateCondition(
  condition: RuleCondition,
  transaction: TransactionWithRelations,
): boolean {
  const value = condition.value;

  switch (condition.type) {
    case 'AMOUNT_GREATER':
      return transaction.amount > parseFloat(value);
    case 'AMOUNT_LESS':
      return transaction.amount < parseFloat(value);
    case 'AMOUNT_EQUAL':
      return Math.abs(transaction.amount - parseFloat(value)) < 0.01;
    case 'CATEGORY_IS':
      return (
        transaction.category.id === value ||
        transaction.category.name.toLowerCase() === value.toLowerCase()
      );
    case 'CATEGORY_NOT':
      return (
        transaction.category.id !== value &&
        transaction.category.name.toLowerCase() !== value.toLowerCase()
      );
    case 'TAG_IS':
      return transaction.tags.some((tag) => tag.name.toLowerCase() === value.toLowerCase());
    case 'TAG_NOT':
      return !transaction.tags.some((tag) => tag.name.toLowerCase() === value.toLowerCase());
    case 'CONTAINS':
      return (
        (transaction.description || '').toLowerCase().includes(value.toLowerCase()) ||
        (transaction.notes || '').toLowerCase().includes(value.toLowerCase())
      );
    default:
      return false;
  }
}

async function executeAction(action: RuleAction, transaction: TransactionWithRelations) {
  switch (action.type) {
    case 'ADD_TAG': {
      const tag = await prisma.tag.upsert({
        where: {
          workspaceId_name: { name: action.value, workspaceId: transaction.workspaceId },
        },
        create: { name: action.value, workspaceId: transaction.workspaceId },
        update: {},
      });
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { tags: { connect: { id: tag.id } } },
      });
      break;
    }
    case 'ADD_CATEGORY': {
      const category = await prisma.category.findFirst({
        where: {
          workspaceId: transaction.workspaceId,
          name: { equals: action.value, mode: 'insensitive' },
        },
      });
      if (category) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { categoryId: category.id },
        });
      }
      break;
    }
    case 'SET_STATUS': {
      const status = action.value.toUpperCase();
      if (status in TransactionStatus) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: status as TransactionStatus },
        });
      }
      break;
    }
    case 'ADD_COST_CENTER': {
      const costCenter = await prisma.costCenter.findFirst({
        where: {
          workspaceId: transaction.workspaceId,
          name: { equals: action.value, mode: 'insensitive' },
        },
      });
      if (costCenter) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { costCenterId: costCenter.id },
        });
      }
      break;
    }
    case 'REMOVE_TAG': {
      const tag = await prisma.tag.findFirst({
        where: {
          workspaceId: transaction.workspaceId,
          name: { equals: action.value, mode: 'insensitive' },
        },
      });
      if (tag) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { tags: { disconnect: { id: tag.id } } },
        });
      }
      break;
    }
    case 'SET_ACCOUNT': {
      const account = await prisma.account.findFirst({
        where: {
          workspaceId: transaction.workspaceId,
          name: { equals: action.value, mode: 'insensitive' },
        },
      });
      if (account) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { accountId: account.id },
        });
      }
      break;
    }
    case 'SET_PAYMENT_METHOD': {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          workspaceId: transaction.workspaceId,
          name: { equals: action.value, mode: 'insensitive' },
        },
      });
      if (paymentMethod) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { paymentMethodId: paymentMethod.id },
        });
      }
      break;
    }
    case 'SET_SUPPLIER': {
      const supplier = await prisma.supplier.findFirst({
        where: {
          workspaceId: transaction.workspaceId,
          name: { equals: action.value, mode: 'insensitive' },
        },
      });
      if (supplier) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { supplierId: supplier.id },
        });
      }
      break;
    }
    case 'NOTIFY': {
      const { createNotification } = await import('@/lib/actions/notifications');

      const templateId = action.value?.startsWith('template:')
        ? action.value.slice('template:'.length)
        : null;
      const template = templateId
        ? await prisma.notificationTemplate.findFirst({
            where: { id: templateId, workspaceId: transaction.workspaceId, isActive: true },
          })
        : null;

      if (template) {
        const vars: Record<string, unknown> = {
          amount: transaction.amount.toFixed(2),
          category: transaction.category.name,
          description: transaction.description || '',
        };
        const interpolate = (text: string) =>
          text.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(vars[key] ?? ''));
        const stripHtml = (html: string) =>
          html
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const title =
          template.channel === 'WHATSAPP' ? template.name : interpolate(template.subject);
        const message =
          template.channel === 'WHATSAPP'
            ? stripHtml(interpolate(template.bodyWhatsapp))
            : stripHtml(interpolate(template.bodyHtml));

        await createNotification({
          type: template.type,
          title,
          message,
          level: 'INFO',
          link: '/transactions',
          metadata: { transactionId: transaction.id, ...vars },
        });
        break;
      }

      await createNotification({
        type: 'SYSTEM',
        title: 'Regra de automação disparada',
        message: action.value || `A regra de automação foi aplicada à transação.`,
        level: 'INFO',
        link: '/transactions',
        metadata: { transactionId: transaction.id },
      });
      break;
    }
    default:
      break;
  }
}

export async function applyConditionalRules(workspaceId: string, transactionId: string) {
  try {
    const rules = await prisma.conditionalRule.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { priority: 'asc' },
    });

    if (rules.length === 0) return;

    let transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { category: true, tags: true },
    });

    if (!transaction) return;

    for (const rule of rules) {
      const conditions = (rule.conditions as unknown as RuleCondition[]) || [];
      const actions = (rule.actions as unknown as RuleAction[]) || [];

      const txForEval: TransactionWithRelations = {
        id: transaction.id,
        amount: Number(transaction.amount),
        categoryId: transaction.categoryId,
        description: transaction.description,
        notes: transaction.notes,
        workspaceId: transaction.workspaceId,
        category: transaction.category,
        tags: transaction.tags,
      };

      const matches =
        conditions.length > 0 && conditions.every((c) => evaluateCondition(c, txForEval));

      if (matches) {
        for (const action of actions) {
          await executeAction(action, txForEval);
        }
        // Reload in case actions changed category/tags, so later rules see fresh state
        const refreshed = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: { category: true, tags: true },
        });
        if (refreshed) transaction = refreshed;
      }
    }
  } catch (error) {
    console.error('Error applying conditional rules:', error);
    await notifyAutomationFailure(
      workspaceId,
      `Falha ao aplicar regras de automação: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    );
  }
}

async function notifyAutomationFailure(workspaceId: string, detail: string) {
  try {
    const user = await prisma.user.findFirst({ where: { workspaceId } });
    if (!user) return;

    const { notifyAutomationResult } = await import('@/lib/actions/notifications');
    await notifyAutomationResult({
      source: 'CONDITIONAL_RULE',
      success: false,
      detail,
      userId: user.id,
      workspaceId,
    });
  } catch (error) {
    console.error('Error notifying automation failure:', error);
  }
}
