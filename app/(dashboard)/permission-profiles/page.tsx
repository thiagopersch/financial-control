import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getPermissionProfiles } from '@/lib/queries/permission-profiles';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PermissionProfilesClient } from './permission-profiles-client';

export default async function PermissionProfilesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'permission-profiles', 'VIEW')) {
    redirect('/dashboard');
  }

  const profiles = await getPermissionProfiles();

  return (
    <div className="animate-in fade-in py-6 duration-700">
      <PermissionProfilesClient profiles={profiles} />
    </div>
  );
}
