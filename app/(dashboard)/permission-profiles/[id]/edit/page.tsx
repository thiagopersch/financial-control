import { PermissionProfileFormPage } from '@/app/(dashboard)/permission-profiles/components/permission-profile-form-page';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getPermissionProfileById } from '@/lib/queries/permission-profiles';
import { getPermissionCatalogGrouped } from '@/lib/services/permission-profiles';
import { notFound, redirect } from 'next/navigation';

export default async function EditPermissionProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  if (!hasPermission(session.user.permissions, 'permission-profiles', 'UPDATE')) {
    redirect('/permission-profiles');
  }

  const { id } = await params;
  const [profile, catalog] = await Promise.all([
    getPermissionProfileById(id),
    getPermissionCatalogGrouped(),
  ]);

  if (!profile) notFound();

  return <PermissionProfileFormPage profile={profile} catalog={catalog} />;
}
