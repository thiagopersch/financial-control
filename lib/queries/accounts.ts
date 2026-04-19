import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getAccounts() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const accounts = await prisma.account.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance.toNumber(),
      color: account.color,
      workspaceId: account.workspaceId,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}
