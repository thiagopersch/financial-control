import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const type = searchParams.get('type') as TransactionType | null;
  const status = searchParams.get('status') as TransactionStatus | null;
  const category = searchParams.get('category');

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  if (from) where.date = { ...where.date, gte: new Date(from) };
  if (to) where.date = { ...where.date, lte: new Date(to) };
  if (type) where.type = type;
  if (status) where.status = status;
  if (category) where.categoryId = category;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true, supplier: true },
    orderBy: { date: 'desc' },
  });

  const typeLabel = (t: TransactionType) => (t === TransactionType.INCOME ? 'Receita' : 'Despesa');
  const statusLabel = (s: TransactionStatus) => {
    const map = { PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Atrasado' };
    return map[s];
  };

  const header = ['Data', 'Tipo', 'Categoria', 'Fornecedor', 'Valor (R$)', 'Status', 'Observações'];
  const rows = transactions.map((t) => [
    format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR }),
    typeLabel(t.type),
    t.category.name,
    t.supplier?.name || '',
    Number(t.amount).toFixed(2).replace('.', ','),
    statusLabel(t.status),
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
