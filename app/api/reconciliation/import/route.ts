import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { addDays, subDays } from 'date-fns';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(
  text: string,
): { date: string; description: string; amount: string; type: string }[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = header.indexOf('data');
  const descIdx =
    header.indexOf('descricao') !== -1 ? header.indexOf('descricao') : header.indexOf('descrição');
  const amountIdx = header.indexOf('valor');
  const typeIdx = header.indexOf('tipo');

  return lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    return {
      date: cols[dateIdx] || '',
      description: cols[descIdx] || '',
      amount: cols[amountIdx] || '0',
      type: (cols[typeIdx] || '').toUpperCase(),
    };
  });
}

function parseDate(value: string): Date | null {
  // Accepts dd/MM/yyyy or yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        {
          error:
            'Apenas arquivos CSV são suportados no momento. Baixe o modelo em /api/reconciliation/template.',
        },
        { status: 400 },
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'O arquivo está vazio ou em formato inválido' },
        { status: 400 },
      );
    }

    let bankAccount = await prisma.bankAccount.findFirst({
      where: { workspaceId: session.user.workspaceId, name: 'Importações' },
    });
    if (!bankAccount) {
      bankAccount = await prisma.bankAccount.create({
        data: {
          name: 'Importações',
          bankName: 'Extrato importado',
          workspaceId: session.user.workspaceId,
        },
      });
    }

    const internalTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        date: { gte: subDays(new Date(), 400) },
      },
      select: { id: true, amount: true, date: true, type: true },
    });

    let imported = 0;
    let matched = 0;

    for (const row of rows) {
      const date = parseDate(row.date);
      const amount = Math.abs(parseFloat(row.amount.replace(',', '.')));
      const type = row.type === 'INCOME' || row.type === 'RECEITA' ? 'INCOME' : 'EXPENSE';

      if (!date || !row.description || isNaN(amount)) continue;

      const candidate = internalTransactions.find(
        (t) =>
          t.type === type &&
          Math.abs(Number(t.amount) - amount) < 0.01 &&
          t.date >= subDays(date, 3) &&
          t.date <= addDays(date, 3),
      );

      await prisma.bankTransaction.create({
        data: {
          bankAccountId: bankAccount.id,
          date,
          description: row.description,
          amount,
          type,
          status: candidate ? 'MATCHED' : 'UNMATCHED',
          matchedTransactionId: candidate?.id,
        },
      });

      imported++;
      if (candidate) matched++;
    }

    return NextResponse.json({
      success: true,
      message: `${imported} transações importadas, ${matched} conciliadas automaticamente.`,
      imported,
      matched,
    });
  } catch (error) {
    console.error('Error importing reconciliation:', error);
    return NextResponse.json({ error: 'Erro ao importar arquivo' }, { status: 500 });
  }
}
