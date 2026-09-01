import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';
import {
  ADMIN_PROFILE_NAME,
  ensureDefaultPermissionProfiles,
  MANAGER_PROFILE_NAME,
  VIEWER_PROFILE_NAME,
} from '../lib/services/permission-profiles';

// Ensure .env is loaded when running this script directly via ts-node
config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * One-off data migration for the ADMIN/MANAGER/VIEWER `Role` enum -> the
 * `PermissionProfile` system. MUST run after the `add_permission_system`
 * migration (adds nullable `User.permissionProfileId`) and BEFORE
 * `drop_role_enum` (drops `User.role` and makes `permissionProfileId`
 * required) — that migration's `ALTER COLUMN ... SET NOT NULL` fails outright
 * if any user still has a NULL `permissionProfileId` at that point.
 *
 * Reads/writes `role`/`permissionProfileId` via raw SQL because the current
 * Prisma schema (already updated for the post-drop_role_enum state) no
 * longer declares `role` and treats `permissionProfileId` as required — the
 * columns this script touches still exist as-is in the database as long as
 * `drop_role_enum` hasn't been applied yet, regardless of what the deployed
 * schema.prisma says.
 *
 * Safe to run more than once: only touches users where
 * `permissionProfileId IS NULL`.
 */
const ROLE_TO_PROFILE_NAME: Record<string, string> = {
  ADMIN: ADMIN_PROFILE_NAME,
  MANAGER: MANAGER_PROFILE_NAME,
  VIEWER: VIEWER_PROFILE_NAME,
};

async function main() {
  const usersWithoutProfile = await prisma.$queryRaw<
    { id: string; workspaceId: string; role: string }[]
  >`SELECT id, "workspaceId", role FROM "User" WHERE "permissionProfileId" IS NULL`;

  if (usersWithoutProfile.length === 0) {
    console.log('Nothing to backfill: every user already has a permissionProfileId.');
    return;
  }

  const workspaceIds = [...new Set(usersWithoutProfile.map((u) => u.workspaceId))];
  const profileIdByWorkspaceAndName = new Map<string, string>();

  for (const workspaceId of workspaceIds) {
    await ensureDefaultPermissionProfiles(prisma, workspaceId);
    const profiles = await prisma.permissionProfile.findMany({
      where: { workspaceId, name: { in: Object.values(ROLE_TO_PROFILE_NAME) } },
    });
    for (const profile of profiles) {
      profileIdByWorkspaceAndName.set(`${workspaceId}:${profile.name}`, profile.id);
    }
  }

  const updates = usersWithoutProfile.map((user) => {
    const profileName = ROLE_TO_PROFILE_NAME[user.role] ?? VIEWER_PROFILE_NAME;
    const profileId = profileIdByWorkspaceAndName.get(`${user.workspaceId}:${profileName}`);
    if (!profileId) {
      throw new Error(
        `Perfil "${profileName}" não encontrado para o workspace ${user.workspaceId} (usuário ${user.id})`,
      );
    }
    return prisma.$executeRaw`UPDATE "User" SET "permissionProfileId" = ${profileId} WHERE id = ${user.id}`;
  });

  await prisma.$transaction(updates);

  console.log(
    `Backfill concluído: ${usersWithoutProfile.length} usuário(s) em ${workspaceIds.length} workspace(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
