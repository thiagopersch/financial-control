import { getTransactionSituation } from '@/lib/utils/transaction-status';

type TotalsTransaction = {
  type: string;
  status: string;
  amount: number | string | { toString(): string };
  date: Date | string;
  dueDate: Date | string | null;
};

export interface AmountCount {
  count: number;
  amount: number;
}

export interface TransactionTotals {
  count: number;
  expense: AmountCount & {
    paid: AmountCount;
    pending: AmountCount;
    /** Parte do `pending` já vencida (mesma regra da linha vermelha da tabela). */
    overdue: AmountCount;
    /** Percentual (0–100) do valor das despesas já pago. */
    paidPercent: number;
  };
  income: AmountCount & { received: AmountCount; pending: AmountCount };
  /** Receitas − despesas (previsto, independente do status). */
  balance: number;
  /** Recebido − pago (o que já se realizou). */
  realizedBalance: number;
}

const empty = (): AmountCount => ({ count: 0, amount: 0 });

function add(bucket: AmountCount, amount: number) {
  bucket.count += 1;
  bucket.amount += amount;
}

/** Totais do rodapé da lista de transações. Transferências ficam de fora. */
export function summarizeTransactions(
  transactions: readonly TotalsTransaction[],
  now: Date = new Date(),
): TransactionTotals {
  const expense = { ...empty(), paid: empty(), pending: empty(), overdue: empty() };
  const income = { ...empty(), received: empty(), pending: empty() };

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    const isPaid = transaction.status === 'PAID';

    if (transaction.type === 'EXPENSE') {
      add(expense, amount);
      if (isPaid) {
        add(expense.paid, amount);
      } else {
        add(expense.pending, amount);
        if (getTransactionSituation(transaction, now) === 'OVERDUE') add(expense.overdue, amount);
      }
    } else if (transaction.type === 'INCOME') {
      add(income, amount);
      add(isPaid ? income.received : income.pending, amount);
    }
  }

  return {
    count: transactions.length,
    expense: {
      ...expense,
      paidPercent:
        expense.amount > 0 ? Math.round((expense.paid.amount / expense.amount) * 100) : 0,
    },
    income,
    balance: income.amount - expense.amount,
    realizedBalance: income.received.amount - expense.paid.amount,
  };
}
