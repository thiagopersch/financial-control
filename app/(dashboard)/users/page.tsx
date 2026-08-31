import { UserList } from '@/components/users/user-list';
import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'users', 'VIEW')) {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: 'asc' },
    include: { profile: true, permissionProfile: true },
  });

  return (
    <div className="animate-in fade-in space-y-6 duration-700">
      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
