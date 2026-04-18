import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { type AIMessage } from "@/types/ai";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    const messages = (conversation.messages as unknown as AIMessage[]) || [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Erro ao buscar conversa" }, { status: 500 });
  }
}

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

    await prisma.aIConversation.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Erro ao excluir conversa" }, { status: 500 });
  }
}
