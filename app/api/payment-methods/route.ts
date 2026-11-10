import { paginationMeta, parsePagination } from '@/lib/utils/pagination';
import { getSession } from '@/lib/auth/session';
import { getPaymentMethodsPaginated } from '@/lib/queries/payment-methods';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { page, pageSize, q } = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 100,
    });
    const { paymentMethods, totalCount } = await getPaymentMethodsPaginated({ q, page, pageSize });

    return NextResponse.json({
      paymentMethods,
      pagination: paginationMeta(page, pageSize, totalCount),
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Erro ao buscar meios de pagamento' }, { status: 500 });
  }
}
