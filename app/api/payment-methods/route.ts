import { authOptions } from '@/lib/auth-options';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const paymentMethods = await getPaymentMethods();

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Erro ao buscar meios de pagamento' }, { status: 500 });
  }
}
