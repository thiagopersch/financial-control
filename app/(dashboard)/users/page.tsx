import { UserList } from '@/components/users/user-list';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const session = await getSession();
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'users', 'VIEW')) {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: 'asc' },
    // Nunca envia o hash da senha para o client.
    omit: { password: true },
    include: { profile: true, permissionProfile: true },
  });

  return (
    <div className="animate-in fade-in space-y-6 duration-700">
      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
