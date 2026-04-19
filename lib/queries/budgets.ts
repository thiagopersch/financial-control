"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getBudgets() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      include: {
        category: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return budgets.map((budget) => ({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: Number(budget.amount),
      month: budget.month,
      year: budget.year,
      alertAt80: budget.alertAt80,
      alertAt100: budget.alertAt100,
      category: {
        id: budget.category.id,
        name: budget.category.name,
        color: budget.category.color,
        type: budget.category.type,
        workspaceId: budget.category.workspaceId,
      },
    }));
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }
}