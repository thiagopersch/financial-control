import { PermissionProfileFormPage } from '@/app/(dashboard)/permission-profiles/components/permission-profile-form-page';
import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getPermissionCatalogGrouped } from '@/lib/services/permission-profiles';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function NewPermissionProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'permission-profiles', 'CREATE')) {
    redirect('/permission-profiles');
  }

  const catalog = await getPermissionCatalogGrouped();

  return <PermissionProfileFormPage catalog={catalog} />;
}
