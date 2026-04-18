import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const hasTransactions = await prisma.transaction.findFirst({
      where: { costCenterId: id },
    });

    if (hasTransactions) {
      return NextResponse.json(
        { error: "Este centro de custo possui transações vinculadas e não pode ser excluído." },
        { status: 400 },
      );
    }

    await prisma.costCenter.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cost center:", error);
    return NextResponse.json({ error: "Erro ao excluir centro de custo" }, { status: 500 });
  }
}
