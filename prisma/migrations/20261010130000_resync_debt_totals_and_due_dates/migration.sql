-- Data fix: o formulário de transação só edita `date` ("Data de vencimento"), mas o
-- `dueDate` antigo continuava prevalecendo na situação (vencida/em dia). Daqui em
-- diante `dueDate` espelha `date`.
UPDATE "Transaction"
SET "dueDate" = "date"
WHERE "dueDate" IS NULL OR "dueDate" <> "date";

-- Data fix: total/saldo das dívidas parceladas recalculados a partir das parcelas
-- vinculadas (fonte da verdade) — corrige progresso acima de 100% e saldo negativo.
UPDATE "Debt" d
SET "initialValue" = s.total,
    "currentValue" = s.total - s.paid,
    "status" = CASE
      WHEN d."status" IN ('ACTIVE', 'PAID')
        THEN (CASE WHEN s.total - s.paid > 0 THEN 'ACTIVE' ELSE 'PAID' END)::"DebtStatus"
      ELSE d."status"
    END
FROM (
  SELECT "debtId",
         SUM("amount") AS total,
         SUM(CASE WHEN "status" = 'PAID' THEN "amount" ELSE 0 END) AS paid
  FROM "Transaction"
  WHERE "debtId" IS NOT NULL
  GROUP BY "debtId"
) s
WHERE s."debtId" = d."id"
  AND d."installments" > 0;
