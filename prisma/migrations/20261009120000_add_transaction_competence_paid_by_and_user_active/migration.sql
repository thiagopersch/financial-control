-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable (colunas nullable para permitir o backfill)
ALTER TABLE "Transaction" ADD COLUMN     "competence" DATE,
ADD COLUMN     "originalCompetence" DATE,
ADD COLUMN     "paidById" TEXT;

-- Backfill: competência = mês da data de vencimento (campo `date`), no fuso de Brasília
UPDATE "Transaction"
SET "competence" = date_trunc('month', ("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date,
    "originalCompetence" = date_trunc('month', ("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date;

ALTER TABLE "Transaction" ALTER COLUMN "competence" SET NOT NULL,
ALTER COLUMN "originalCompetence" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_competence_idx" ON "Transaction"("workspaceId", "competence");

-- CreateIndex
CREATE INDEX "Transaction_paidById_idx" ON "Transaction"("paidById");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
