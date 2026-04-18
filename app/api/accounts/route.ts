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

    const accounts = await prisma.account.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        name: "asc",
      },
    });

    const accountsWithBalance = accounts.map((account) => ({
      ...account,
      balance: Number(account.balance),
    }));

    return NextResponse.json({ accounts: accountsWithBalance });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, balance, color } = body;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: balance || 0,
        color: color || "#000000",
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(
      { account: { ...account, balance: Number(account.balance) } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
