import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { UserList } from "@/components/users/user-list";
import { UsersHeader } from "@/components/users/users-header";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const users = await prisma.user.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <UsersHeader />
      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
