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

    const debts = await prisma.debt.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const debtsWithNumbers = debts.map((debt) => ({
      ...debt,
      initialValue: Number(debt.initialValue),
      currentValue: Number(debt.currentValue),
      interestRate: debt.interestRate ? Number(debt.interestRate) : null,
      minimumPayment: Number(debt.minimumPayment),
    }));

    return NextResponse.json({ debts: debtsWithNumbers });
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json({ error: "Erro ao buscar dívidas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      initialValue,
      currentValue,
      interestRate,
      minimumPayment,
      dueDay,
      startDate,
    } = body;

    const debt = await prisma.debt.create({
      data: {
        name,
        description: description || null,
        initialValue,
        currentValue,
        interestRate,
        minimumPayment,
        dueDay,
        startDate: new Date(startDate),
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(
      {
        debt: {
          ...debt,
          initialValue: Number(debt.initialValue),
          currentValue: Number(debt.currentValue),
          interestRate: debt.interestRate ? Number(debt.interestRate) : null,
          minimumPayment: Number(debt.minimumPayment),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating debt:", error);
    return NextResponse.json({ error: "Erro ao criar dívida" }, { status: 500 });
  }
}
