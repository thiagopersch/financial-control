'use server';

import {
  applyConditionals,
  interpolate,
  stripHtml,
} from '@/lib/notification-templates/interpolate';
import {
  buildAccountVars,
  buildBudgetVars,
  buildCreditCardVars,
  buildDebtVars,
  buildGoalVars,
  buildPaymentMethodVars,
  buildTransactionVars,
  buildUserVars,
  BUDGET_VARS_INCLUDE,
  CREDIT_CARD_VARS_INCLUDE,
  DEBT_VARS_INCLUDE,
  PAYMENT_METHOD_VARS_INCLUDE,
  TRANSACTION_VARS_INCLUDE,
} from '@/lib/notification-templates/vars-builder';
import { resolveEmailBodyHtml } from '@/lib/notification-templates/render';
import { detectTemplateEntityPages } from '@/lib/notification-templates/variable-catalog';
import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { sendEmail, sendWhatsApp } from '@/lib/services/notification-delivery';

interface TestSendEntityIds {
  transactionId?: string;
  accountId?: string;
  paymentMethodId?: string;
  creditCardId?: string;
  debtId?: string;
  budgetId?: string;
  goalId?: string;
}

const PAGE_TO_ENTITY_KEY: Record<string, keyof TestSendEntityIds> = {
  transaction: 'transactionId',
  account: 'accountId',
  paymentMethod: 'paymentMethodId',
  creditCard: 'creditCardId',
  debt: 'debtId',
  budget: 'budgetId',
  goal: 'goalId',
};

const PAGE_LABELS: Record<string, string> = {
  transaction: 'uma transação',
  account: 'uma conta',
  paymentMethod: 'um meio de pagamento',
  creditCard: 'um cartão de crédito',
  debt: 'uma dívida',
  budget: 'um orçamento',
  goal: 'uma meta',
};

export async function sendTestNotificationTemplate(input: {
  templateId: string;
  userId: string;
  entityIds?: TestSendEntityIds;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requirePermission('notification-templates', 'VIEW');

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: input.templateId,
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });
    if (!template) return { success: false, error: 'Template não encontrado' };

    const recipient = await prisma.user.findUnique({
      where: { id: input.userId, workspaceId: session.user.workspaceId },
      include: { profile: true },
    });
    if (!recipient) return { success: false, error: 'Destinatário não encontrado' };

    if (template.channel === 'EMAIL' && !(recipient.profile?.notifyEmail && recipient.email)) {
      return {
        success: false,
        error: `${recipient.name} não está habilitado para receber e-mails.`,
      };
    }
    if (
      template.channel === 'WHATSAPP' &&
      !(recipient.profile?.notifyWhatsapp && recipient.profile.phone)
    ) {
      return {
        success: false,
        error: `${recipient.name} não está habilitado para receber WhatsApp.`,
      };
    }

    const entityPages = detectTemplateEntityPages(template).filter(
      (page) => page !== 'general' && page !== 'user',
    );

    let vars: Record<string, unknown> = buildUserVars(recipient);
    const entityIds = input.entityIds || {};

    for (const page of entityPages) {
      const entityKey = PAGE_TO_ENTITY_KEY[page];
      const id = entityKey ? entityIds[entityKey] : undefined;
      if (!id) {
        return {
          success: false,
          error: `Selecione ${PAGE_LABELS[page] || 'um registro'} para testar este template.`,
        };
      }

      switch (page) {
        case 'transaction': {
          const tx = await prisma.transaction.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
            include: TRANSACTION_VARS_INCLUDE,
          });
          if (!tx) return { success: false, error: 'Transação selecionada não encontrada' };
          vars = { ...vars, ...buildTransactionVars(tx) };
          break;
        }
        case 'account': {
          const account = await prisma.account.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
          });
          if (!account) return { success: false, error: 'Conta selecionada não encontrada' };
          vars = { ...vars, ...buildAccountVars(account) };
          break;
        }
        case 'paymentMethod': {
          const pm = await prisma.paymentMethod.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
            include: PAYMENT_METHOD_VARS_INCLUDE,
          });
          if (!pm) return { success: false, error: 'Meio de pagamento selecionado não encontrado' };
          vars = { ...vars, ...buildPaymentMethodVars(pm) };
          break;
        }
        case 'creditCard': {
          const card = await prisma.creditCard.findFirst({
            where: { id, account: { workspaceId: session.user.workspaceId } },
            include: CREDIT_CARD_VARS_INCLUDE,
          });
          if (!card) return { success: false, error: 'Cartão selecionado não encontrado' };
          vars = { ...vars, ...buildCreditCardVars(card) };
          break;
        }
        case 'debt': {
          const debt = await prisma.debt.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
            include: DEBT_VARS_INCLUDE,
          });
          if (!debt) return { success: false, error: 'Dívida selecionada não encontrada' };
          const creditCard = debt.creditCardId
            ? await prisma.creditCard.findUnique({
                where: { id: debt.creditCardId },
                include: { account: true },
              })
            : null;
          vars = { ...vars, ...buildDebtVars(debt, creditCard?.account.name ?? null) };
          break;
        }
        case 'budget': {
          const budget = await prisma.budget.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
            include: BUDGET_VARS_INCLUDE,
          });
          if (!budget) return { success: false, error: 'Orçamento selecionado não encontrado' };
          vars = { ...vars, ...buildBudgetVars(budget) };
          break;
        }
        case 'goal': {
          const goal = await prisma.goal.findFirst({
            where: { id, workspaceId: session.user.workspaceId },
          });
          if (!goal) return { success: false, error: 'Meta selecionada não encontrada' };
          vars = { ...vars, ...buildGoalVars(goal) };
          break;
        }
      }
    }

    if (template.channel === 'EMAIL') {
      const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
      });
      const subject = interpolate(template.subject, vars);
      const htmlBody = interpolate(applyConditionals(resolveEmailBodyHtml(template), vars), vars);
      await sendEmail(
        workspace,
        recipient.email,
        `[Teste] ${subject}`,
        stripHtml(htmlBody),
        htmlBody,
        template.imageUrl,
      );
    } else {
      const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
      });
      const message = stripHtml(interpolate(template.bodyWhatsapp, vars));
      await sendWhatsApp(
        workspace,
        recipient.profile!.phone!,
        `[Teste] ${message}`,
        template.imageUrl,
      );
    }

    await createAuditLog({
      action: 'TEST_SEND_NOTIFICATION_TEMPLATE',
      entity: 'NotificationTemplate',
      entityId: template.id,
      newValue: { recipientId: recipient.id, channel: template.channel },
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending test notification template:', error);
    return { success: false, error: 'Erro ao enviar teste do template' };
  }
}
