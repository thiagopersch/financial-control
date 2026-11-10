import { PermissionProfileFormPage } from '@/app/(dashboard)/permission-profiles/components/permission-profile-form-page';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getPermissionCatalogGrouped } from '@/lib/services/permission-profiles';
import { redirect } from 'next/navigation';

export default async function NewPermissionProfilePage() {
  const session = await getSession();
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'permission-profiles', 'CREATE')) {
    redirect('/permission-profiles');
  }

  const catalog = await getPermissionCatalogGrouped();

  return <PermissionProfileFormPage catalog={catalog} />;
}
