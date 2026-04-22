import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const debts = await prisma.debt.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      debts: debts.map((d) => ({
        ...d,
        initialValue: Number(d.initialValue),
        currentValue: Number(d.currentValue),
        interestRate: d.interestRate ? Number(d.interestRate) : null,
        minimumPayment: Number(d.minimumPayment),
        startDate: d.startDate.toISOString(),
        endDate: d.endDate?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json({ error: 'Erro ao buscar dívidas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      initialValue,
      currentValue,
      interestRate,
      minimumPayment,
      dueDay,
      startDate,
      installments,
      accountId,
    } = body;

    const debt = await prisma.debt.create({
      data: {
        name,
        description,
        initialValue,
        currentValue: currentValue || initialValue,
        interestRate,
        minimumPayment,
        dueDay,
        startDate: new Date(startDate),
        installments,
        isActive: true,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(
      {
        debt: {
          ...debt,
          initialValue: Number(debt.initialValue),
          currentValue: Number(debt.currentValue),
          interestRate: debt.interestRate ? Number(debt.interestRate) : null,
          minimumPayment: Number(debt.minimumPayment),
          startDate: debt.startDate.toISOString(),
          endDate: debt.endDate?.toISOString() || null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json({ error: 'Erro ao criar dívida' }, { status: 500 });
  }
}
