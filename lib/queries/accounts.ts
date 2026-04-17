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
      ...account,
      balance: account.balance.toNumber(),
    }));
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}
