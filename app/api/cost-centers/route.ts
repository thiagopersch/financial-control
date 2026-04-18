import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const costCenters = await prisma.costCenter.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const costCentersWithStats = await Promise.all(
      costCenters.map(async (center) => {
        const [expenses, incomes, transactionCount] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              costCenterId: center.id,
              type: "EXPENSE",
              status: "PAID",
              date: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              costCenterId: center.id,
              type: "INCOME",
              status: "PAID",
              date: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: { costCenterId: center.id },
          }),
        ]);

        return {
          ...center,
          totalExpense: Number(expenses._sum.amount || 0),
          totalIncome: Number(incomes._sum.amount || 0),
          transactionCount,
        };
      }),
    );

    return NextResponse.json({ costCenters: costCentersWithStats });
  } catch (error) {
    console.error("Error fetching cost centers:", error);
    return NextResponse.json({ error: "Erro ao buscar centros de custo" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, parentId } = body;

    const costCenter = await prisma.costCenter.create({
      data: {
        name,
        description: description || null,
        color: color || "#64748b",
        parentId: parentId || null,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ costCenter }, { status: 201 });
  } catch (error) {
    console.error("Error creating cost center:", error);
    return NextResponse.json({ error: "Erro ao criar centro de custo" }, { status: 500 });
  }
}
