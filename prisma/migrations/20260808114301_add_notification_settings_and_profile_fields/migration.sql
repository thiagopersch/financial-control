-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "smtpFrom" TEXT,
ADD COLUMN     "smtpHost" TEXT,
ADD COLUMN     "smtpPassword" TEXT,
ADD COLUMN     "smtpPort" INTEGER,
ADD COLUMN     "smtpUser" TEXT,
ADD COLUMN     "whatsappApiToken" TEXT,
ADD COLUMN     "whatsappApiUrl" TEXT;
