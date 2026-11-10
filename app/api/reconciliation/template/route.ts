import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const csv = [
    'data,descricao,valor,tipo',
    '10/01/2026,Supermercado ABC,150.00,EXPENSE',
    '15/01/2026,Salário,5000.00,INCOME',
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="modelo-conciliacao.csv"',
    },
  });
}
