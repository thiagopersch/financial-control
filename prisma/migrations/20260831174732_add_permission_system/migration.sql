-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissionProfileId" TEXT;

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "module" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionProfilePermission" (
    "permissionProfileId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "PermissionProfilePermission_pkey" PRIMARY KEY ("permissionProfileId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionProfile_workspaceId_name_key" ON "PermissionProfile"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_permissionProfileId_fkey" FOREIGN KEY ("permissionProfileId") REFERENCES "PermissionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionProfile" ADD CONSTRAINT "PermissionProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionProfilePermission" ADD CONSTRAINT "PermissionProfilePermission_permissionProfileId_fkey" FOREIGN KEY ("permissionProfileId") REFERENCES "PermissionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionProfilePermission" ADD CONSTRAINT "PermissionProfilePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
