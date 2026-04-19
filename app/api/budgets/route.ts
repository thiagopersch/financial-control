import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { endOfYear, startOfYear, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    
    const currentYear = new Date().getFullYear();

    let whereClause: any = {
      workspaceId: session.user.workspaceId,
    };

    // Mês específico tem prioridade sobre ano
    if (all) {
      // Todos os orçamentos - não filtra por mês/ano
    } else if (monthParam && yearParam) {
      const month = parseInt(monthParam);
      const year = parseInt(yearParam);
      whereClause.month = month;
      whereClause.year = year;
    } else if (yearParam) {
      const year = parseInt(yearParam);
      whereClause.year = year;
    } else {
      // Padrão: mês atual
      whereClause.month = new Date().getMonth() + 1;
      whereClause.year = currentYear;
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { category: { name: "asc" } },
      ],
    });

    // Obter todas as transações relevantes para os orçamentos
    const uniquePeriods = budgets.map(b => ({
      month: b.month,
      year: b.year
    }));

    const periodsMap = new Map<string, { start: Date; end: Date }>();
    
    uniquePeriods.forEach(period => {
      const key = `${period.month}-${period.year}`;
      if (!periodsMap.has(key)) {
        periodsMap.set(key, {
          start: startOfMonth(new Date(period.year, period.month - 1)),
          end: endOfMonth(new Date(period.year, period.month - 1))
        });
      }
    });

    // Buscar todas as transações de uma vez
    const allTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        type: TransactionType.EXPENSE,
      },
    });

    const budgetsWithSpent = budgets.map((budget) => {
      // Filtrar transações do mês/ano de CRIAÇÃO do orçamento
      const period = periodsMap.get(`${budget.month}-${budget.year}`);
      
      const spent = allTransactions
        .filter((t) => {
          if (!period) return false;
          const transactionDate = new Date(t.date);
          return (
            t.categoryId === budget.categoryId &&
            transactionDate >= period.start &&
            transactionDate <= period.end
          );
        })
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const percent = Number(budget.amount) > 0 
        ? (spent / Number(budget.amount)) * 100 
        : 0;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        amount: Number(budget.amount),
        month: budget.month,
        year: budget.year,
        alertAt80: budget.alertAt80,
        alertAt100: budget.alertAt100,
        spent,
        percent,
        category: {
          id: budget.category.id,
          name: budget.category.name,
          color: budget.category.color,
        },
      };
    });

    return NextResponse.json({ budgets: budgetsWithSpent });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Erro ao buscar orçamentos" }, { status: 500 });
  }
}