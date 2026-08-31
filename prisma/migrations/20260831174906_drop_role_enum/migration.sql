-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_permissionProfileId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ALTER COLUMN "permissionProfileId" SET NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_permissionProfileId_fkey" FOREIGN KEY ("permissionProfileId") REFERENCES "PermissionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
