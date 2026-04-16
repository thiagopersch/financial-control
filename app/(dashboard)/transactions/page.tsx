import { TransactionsHeader } from "@/components/transactions/transactions-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";
import { getServerSession } from "next-auth";

export default async function TransactionsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    month?: string;
    type?: string;
    status?: string;
    category?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;
  const session = await getServerSession(authOptions);

  if (!session) return null;

  let from = startOfMonth(new Date());
  let to = endOfMonth(new Date());

  if (searchParams.month === "year") {
    const currentYear = new Date().getFullYear();
    from = startOfMonth(new Date(currentYear, 0));
    to = endOfMonth(new Date(currentYear, 11));
  } else if (searchParams.month) {
    const [year, m] = searchParams.month.split("-").map(Number);
    from = startOfMonth(new Date(year, m - 1));
    to = endOfMonth(new Date(year, m - 1));
  }

  if (searchParams.from) from = new Date(searchParams.from);
  if (searchParams.to) to = new Date(searchParams.to);

  const where: any = {
    workspaceId: session.user.workspaceId,
    date: {
      gte: from,
      lte: to,
    },
  };

  if (searchParams.type) where.type = searchParams.type as TransactionType;
  if (searchParams.status) where.status = searchParams.status as TransactionStatus;
  if (searchParams.category) where.categoryId = searchParams.category;

  const [rawTransactions, categories, suppliers] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.category.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: "asc" },
    }),
  ]);

  const transactions = rawTransactions.map((transaction) => ({
    ...transaction,
    amount: transaction.amount.toNumber(),
  }));

  return (
    <div className="animate-in fade-in space-y-6 duration-700">
      <TransactionsHeader categories={categories} suppliers={suppliers} />
      <TransactionsTable
        transactions={transactions}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
