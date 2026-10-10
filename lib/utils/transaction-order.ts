type SortableTransaction = {
  type: string;
  status: string;
  date: Date | string;
  dueDate: Date | string | null;
  competence: Date | string;
  amount: number | string | { toString(): string };
};

const TYPE_RANK: Record<string, number> = {
  EXPENSE: 0,
  INCOME: 1,
  TRANSFER: 2,
};

function getTypeRank(type: string) {
  return TYPE_RANK[type] ?? 3;
}

/** Pagas vão para o fim da lista, mantendo a mesma ordenação interna. */
function getPaidRank(status: string) {
  return status === 'PAID' ? 1 : 0;
}

function getDueTime(transaction: SortableTransaction) {
  return new Date(transaction.dueDate || transaction.date).getTime();
}

/** Competência é sempre o dia 1 do mês (UTC), então comparar o timestamp equivale a comparar MM/YYYY. */
function getCompetenceTime(transaction: SortableTransaction) {
  return new Date(transaction.competence).getTime();
}

/**
 * Ordem padrão da lista de transações:
 * 1. Não pagas primeiro, pagas por último
 * 2. Tipo: despesa → receita → transferência
 * 3. Valor (maior → menor)
 * 4. Vencimento mais próximo primeiro
 * 5. Competência (MM/YYYY) mais recente primeiro (desempate)
 */
export function compareTransactionsDefault<T extends SortableTransaction>(a: T, b: T) {
  const paidDiff = getPaidRank(a.status) - getPaidRank(b.status);
  if (paidDiff !== 0) return paidDiff;

  const typeDiff = getTypeRank(a.type) - getTypeRank(b.type);
  if (typeDiff !== 0) return typeDiff;

  const amountDiff = Number(b.amount.toString()) - Number(a.amount.toString());
  if (amountDiff !== 0) return amountDiff;

  const dueDiff = getDueTime(a) - getDueTime(b);
  if (dueDiff !== 0) return dueDiff;

  return getCompetenceTime(b) - getCompetenceTime(a);
}
