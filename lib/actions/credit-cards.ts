"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { InvoiceStatus } from "@prisma/client";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

const creditCardSchema = z.object({
  limit: z.coerce.number().positive("Limite deve ser maior que zero"),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  accountId: z.string().min(1, "Conta vinculada é obrigatória"),
  color: z.string().optional().default("#6366f1"),
});

export async function createCreditCard(data: z.infer<typeof creditCardSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = creditCardSchema.parse(data);

    const account = await prisma.account.findUnique({
      where: { id: validated.accountId },
    });

    if (!account || account.workspaceId !== session.user.workspaceId) {
      return { success: false, error: "Conta não encontrada" };
    }

    const existingCard = await prisma.creditCard.findUnique({
      where: { accountId: validated.accountId },
    });

    if (existingCard) {
      return { success: false, error: "Esta conta já possui um cartão de crédito vinculado" };
    }

    const creditCard = await prisma.creditCard.create({
      data: {
        limit: validated.limit,
        closingDay: validated.closingDay,
        dueDay: validated.dueDay,
        accountId: validated.accountId,
        color: validated.color,
      },
      include: {
        account: true,
      },
    });

    const createdCard = {
      id: creditCard.id,
      accountId: creditCard.accountId,
      limit: Number(creditCard.limit),
      usedAmount: Number(creditCard.usedAmount),
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
      color: creditCard.color,
      account: {
        id: creditCard.account.id,
        name: creditCard.account.name,
        type: creditCard.account.type,
        balance: Number(creditCard.account.balance),
        color: creditCard.account.color,
        workspaceId: creditCard.account.workspaceId,
        createdAt: creditCard.account.createdAt.toISOString(),
        updatedAt: creditCard.account.updatedAt.toISOString(),
      },
      createdAt: creditCard.createdAt.toISOString(),
      updatedAt: creditCard.updatedAt.toISOString(),
    };

    await createAuditLog({
      action: "CREATE_CREDIT_CARD",
      entity: "CreditCard",
      entityId: creditCard.id,
      newValue: validated,
    });

    revalidatePath("/credit-cards");
    revalidatePath("/accounts");
    return { success: true, data: createdCard };
  } catch (error) {
    console.error("Error creating credit card:", error);
    return { success: false, error: "Erro ao criar cartão de crédito" };
  }
}

export async function updateCreditCard(id: string, data: z.infer<typeof creditCardSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = creditCardSchema.parse(data);

    const creditCard = await prisma.creditCard.update({
      where: {
        id,
        account: {
          workspaceId: session.user.workspaceId,
        },
      },
      data: {
        limit: validated.limit,
        closingDay: validated.closingDay,
        dueDay: validated.dueDay,
        accountId: validated.accountId,
        color: validated.color,
      },
      include: {
        account: true,
      },
    });

    const updatedCard = {
      id: creditCard.id,
      accountId: creditCard.accountId,
      limit: Number(creditCard.limit),
      usedAmount: Number(creditCard.usedAmount),
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
      color: creditCard.color,
      account: {
        id: creditCard.account.id,
        name: creditCard.account.name,
        type: creditCard.account.type,
        balance: Number(creditCard.account.balance),
        color: creditCard.account.color,
        workspaceId: creditCard.account.workspaceId,
        createdAt: creditCard.account.createdAt.toISOString(),
        updatedAt: creditCard.account.updatedAt.toISOString(),
      },
      createdAt: creditCard.createdAt.toISOString(),
      updatedAt: creditCard.updatedAt.toISOString(),
    };

    await createAuditLog({
      action: "UPDATE_CREDIT_CARD",
      entity: "CreditCard",
      entityId: creditCard.id,
      newValue: validated,
    });

    revalidatePath("/credit-cards");
    revalidatePath("/accounts");
    return { success: true, data: updatedCard };
  } catch (error) {
    console.error("Error updating credit card:", error);
    return { success: false, error: "Erro ao atualizar cartão de crédito" };
  }
}

export async function deleteCreditCard(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const creditCard = await prisma.creditCard.findUnique({
      where: { id },
      include: { invoices: true },
    });

    if (!creditCard) {
      return { success: false, error: "Cartão não encontrado" };
    }

    if (creditCard.invoices.length > 0) {
      return {
        success: false,
        error: "Este cartão possui faturas vinculadas e não pode ser excluído.",
      };
    }

    await prisma.creditCard.delete({
      where: { id },
    });

    await createAuditLog({
      action: "DELETE_CREDIT_CARD",
      entity: "CreditCard",
      entityId: id,
      oldValue: creditCard,
    });

    revalidatePath("/credit-cards");
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting credit card:", error);
    return { success: false, error: "Erro ao excluir cartão de crédito" };
  }
}

export async function getCreditCards() {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const creditCards = await prisma.creditCard.findMany({
      where: {
        account: {
          workspaceId: session.user.workspaceId,
        },
      },
      include: {
        account: true,
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 6,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const creditCardsWithStats = creditCards.map((card) => {
      const availableLimit = Number(card.limit) - Number(card.usedAmount);
      const usagePercentage =
        Number(card.limit) > 0 ? (Number(card.usedAmount) / Number(card.limit)) * 100 : 0;

      return {
        ...card,
        availableLimit,
        usagePercentage,
        limit: Number(card.limit),
        usedAmount: Number(card.usedAmount),
      };
    });

    return { success: true, data: creditCardsWithStats };
  } catch (error) {
    console.error("Error getting credit cards:", error);
    return { success: false, error: "Erro ao buscar cartões de crédito" };
  }
}

export async function closeInvoice(invoiceId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const invoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
        creditCard: {
          account: {
            workspaceId: session.user.workspaceId,
          },
        },
      },
      data: {
        status: InvoiceStatus.CLOSED,
      },
      include: {
        creditCard: {
          include: {
            account: true,
          },
        },
      },
    });

    await createAuditLog({
      action: "CLOSE_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      newValue: { status: "CLOSED" },
    });

    revalidatePath("/credit-cards");
    return { success: true, data: invoice };
  } catch (error) {
    console.error("Error closing invoice:", error);
    return { success: false, error: "Erro ao fechar fatura" };
  }
}

export async function payInvoice(invoiceId: string, paymentAccountId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        creditCard: {
          include: {
            account: true,
          },
        },
        transactions: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Fatura não encontrada" };
    }

    if (invoice.creditCard.account.workspaceId !== session.user.workspaceId) {
      return { success: false, error: "Não autorizado" };
    }

    const paymentTransaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: invoice.amount,
          date: new Date(),
          status: "PAID",
          description: `Pagamento fatura ${invoice.month}/${invoice.year} - ${invoice.creditCard.account.name}`,
          categoryId: invoice.creditCard.account.id,
          accountId: paymentAccountId,
          notes: "Pagamento de fatura de cartão de crédito",
          workspaceId: session.user.workspaceId,
        },
      });

      await tx.account.update({
        where: { id: paymentAccountId },
        data: {
          balance: { decrement: invoice.amount },
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
        },
      });

      await tx.creditCard.update({
        where: { id: invoice.creditCardId },
        data: {
          usedAmount: { decrement: invoice.amount },
        },
      });

      return transaction;
    });

    await createAuditLog({
      action: "PAY_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      newValue: {
        amount: Number(invoice.amount),
        paymentAccountId,
        transactionId: paymentTransaction.id,
      },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    return { success: true, data: paymentTransaction };
  } catch (error) {
    console.error("Error paying invoice:", error);
    return { success: false, error: "Erro ao pagar fatura" };
  }
}

export async function generateInvoices(creditCardId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const creditCard = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
      include: {
        account: true,
      },
    });

    if (!creditCard || creditCard.account.workspaceId !== session.user.workspaceId) {
      return { success: false, error: "Cartão não encontrado" };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        creditCardId,
        month: currentMonth,
        year: currentYear,
      },
    });

    if (existingInvoice) {
      return {
        success: false,
        error: "Fatura do mês atual já existe",
      };
    }

    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: creditCard.accountId,
        type: "EXPENSE",
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
        invoiceId: null,
      },
    });

    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const dueDate = new Date(currentYear, currentMonth - 1, creditCard.dueDay);
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          creditCardId,
          month: currentMonth,
          year: currentYear,
          amount: totalAmount,
          dueDate,
          status: InvoiceStatus.OPEN,
        },
      });

      if (transactions.length > 0) {
        await tx.transaction.updateMany({
          where: {
            id: { in: transactions.map((t) => t.id) },
          },
          data: {
            invoiceId: inv.id,
          },
        });
      }

      return inv;
    });

    await createAuditLog({
      action: "GENERATE_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      newValue: {
        creditCardId,
        month: currentMonth,
        year: currentYear,
        amount: totalAmount,
        transactionCount: transactions.length,
      },
    });

    revalidatePath("/credit-cards");
    return { success: true, data: invoice };
  } catch (error) {
    console.error("Error generating invoice:", error);
    return { success: false, error: "Erro ao gerar fatura" };
  }
}
