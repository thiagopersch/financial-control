'use client';

import { PermissionProfilesList } from './components/permission-profiles-list';
import type { PermissionProfileDTO } from '@/lib/queries/permission-profiles';

interface PermissionProfilesClientProps {
  profiles: PermissionProfileDTO[];
}

export function PermissionProfilesClient({ profiles }: PermissionProfilesClientProps) {
  return <PermissionProfilesList profiles={profiles} onRefresh={() => {}} />;
}
