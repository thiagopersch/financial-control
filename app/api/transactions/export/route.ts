import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { buildTransactionWhere } from '@/lib/queries/transactions';
import { formatCompetence } from '@/lib/utils/competence';
import { compareTransactionsDefault } from '@/lib/utils/transaction-order';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get('format');

  // Mesmo `where` e ordenação da listagem, para o export refletir o que está na tela.
  const where = buildTransactionWhere(
    Object.fromEntries(searchParams.entries()),
    session.user.workspaceId,
  );

  const transactions = (
    await prisma.transaction.findMany({
      where,
      include: { category: true, supplier: true, paidBy: { select: { name: true, email: true } } },
    })
  ).sort(compareTransactionsDefault);

  // Return JSON when format=json is requested (used by XLSX/PDF client exports)
  if (formatParam === 'json') {
    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        date: format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR }),
        competence: formatCompetence(t.competence),
        type: t.type,
        amount: Number(t.amount),
        categoryName: t.category.name,
        supplierName: t.supplier?.name || null,
        status: t.status,
        paidBy: t.paidBy ? t.paidBy.name || t.paidBy.email : null,
        notes: t.notes,
      })),
    });
  }

  const typeLabel = (t: TransactionType) =>
    t === TransactionType.INCOME
      ? 'Receita'
      : t === TransactionType.TRANSFER
        ? 'Transferência'
        : 'Despesa';
  const statusLabel = (s: TransactionStatus) => {
    const map = { PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Atrasado' };
    return map[s];
  };

  const header = [
    'Vencimento',
    'Competência',
    'Tipo',
    'Categoria',
    'Fornecedor',
    'Valor (R$)',
    'Status',
    'Pago por',
    'Observações',
  ];
  const rows = transactions.map((t) => [
    format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR }),
    formatCompetence(t.competence),
    typeLabel(t.type),
    t.category.name,
    t.supplier?.name || '',
    Number(t.amount).toFixed(2).replace('.', ','),
    statusLabel(t.status),
    t.paidBy ? t.paidBy.name || t.paidBy.email : '',
    (t.notes || '').replace(/"/g, '""'),
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(';')).join('\n');

  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  return new NextResponse(BOM + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="transacoes-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  });
}
