import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getBudgetData } from "@/lib/queries/dashboard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BudgetsPageClient } from "./budgets-client";

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const budgets = await getBudgetData(now.getMonth() + 1, now.getFullYear());

  const categories = await prisma.category.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      type: "EXPENSE",
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
        <p className="text-muted-foreground">
          Gerencie seus limites de gastos mensais por categoria.
        </p>
      </div>

      <BudgetsPageClient initialBudgets={budgets} categories={categories} />
    </div>
  );
}
