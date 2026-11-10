import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { getCreditCardUsageDetails } from '@/lib/queries/credit-card-usage';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const creditCard = await prisma.creditCard.findFirst({
      where: { id, account: { workspaceId: session.user.workspaceId } },
    });
    if (!creditCard) {
      return NextResponse.json({ error: 'Cartão de crédito não encontrado' }, { status: 404 });
    }

    const items = await getCreditCardUsageDetails(id);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching credit card usage:', error);
    return NextResponse.json({ error: 'Erro ao buscar consumo do cartão' }, { status: 500 });
  }
}
