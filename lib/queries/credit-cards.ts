"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getCreditCards() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

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

    return creditCards.map((card) => {
      const availableLimit = Number(card.limit) - Number(card.usedAmount);
      const usagePercentage =
        Number(card.limit) > 0 ? (Number(card.usedAmount) / Number(card.limit)) * 100 : 0;

      return {
        id: card.id,
        accountId: card.accountId,
        availableLimit,
        usagePercentage,
        limit: Number(card.limit),
        usedAmount: Number(card.usedAmount),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        color: card.color,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
        account: {
          id: card.account.id,
          name: card.account.name,
          type: card.account.type,
          balance: card.account.balance.toNumber(),
          color: card.account.color,
          workspaceId: card.account.workspaceId,
          createdAt: card.account.createdAt.toISOString(),
          updatedAt: card.account.updatedAt.toISOString(),
        },
        invoices: card.invoices.map((inv) => ({
          id: inv.id,
          creditCardId: inv.creditCardId,
          month: inv.month,
          year: inv.year,
          amount: Number(inv.amount),
          dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
          status: inv.status as string,
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
        })),
      };
    });
  } catch (error) {
    console.error("Error fetching credit cards:", error);
    return [];
  }
}