import { DEBT_STATUS_LABELS } from '@/lib/constants/debt-status';
import {
  dataBlockToken,
  DATA_BLOCK_SOURCES,
  escapeHtml,
  renderDataTable,
  type DataBlockSource,
} from '@/lib/notification-templates/data-sources';
import {
  getExpenseSummary,
  getOpenDebts,
  getOverdueInstallments,
  getOverdueTransactions,
  type OverdueItem,
} from '@/lib/queries/report-data';
import {
  CHART_DISPLAY_WIDTH,
  renderCategoryBarChart,
  renderDailyColumnChart,
} from '@/lib/services/email-charts';
import type { EmailAttachment } from '@/lib/services/notification-delivery';
import { formatInTimeZone } from '@/lib/services/email-schedule';
import { formatCurrency } from '@/lib/utils';
import type { DebtStatus, EmailReportType } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ReportConfig {
  name: string;
  reportType: EmailReportType;
  workspaceId: string;
  includeOverdueTransactions: boolean;
  includeOverdueInstallments: boolean;
  includeOpenDebts: boolean;
  summaryPeriodDays: number;
  timezone?: string;
}

export interface BuiltReport {
  vars: Record<string, unknown>;
  attachments: EmailAttachment[];
  /** Number of relevant items — 0 means "nothing to report" (used by skipIfEmpty). */
  itemsCount: number;
}

const MAX_TABLE_ROWS = 15;

const fmtDate = (d: Date) => format(d, 'dd/MM/yyyy');

function moreFooter(total: number): string | undefined {
  return total > MAX_TABLE_ROWS ? `+ ${total - MAX_TABLE_ROWS} itens não exibidos` : undefined;
}

function overdueTransactionsTable(items: OverdueItem[]) {
  return renderDataTable(
    ['Descrição', 'Vencimento', 'Dias', 'Valor'],
    items
      .slice(0, MAX_TABLE_ROWS)
      .map((t) => [
        escapeHtml(t.description),
        fmtDate(t.dueDate),
        String(t.daysOverdue),
        formatCurrency(t.amount),
      ]),
    moreFooter(items.length),
  );
}

function overdueInstallmentsTable(items: OverdueItem[]) {
  return renderDataTable(
    ['Dívida', 'Parcela', 'Vencimento', 'Valor'],
    items
      .slice(0, MAX_TABLE_ROWS)
      .map((t) => [
        escapeHtml(t.debtName ?? t.description),
        escapeHtml(t.installmentLabel ?? '-'),
        `${fmtDate(t.dueDate)} (${t.daysOverdue}d)`,
        formatCurrency(t.amount),
      ]),
    moreFooter(items.length),
  );
}

function chartImg(cid: string, alt: string) {
  return `<img src="cid:${cid}" alt="${alt}" width="${CHART_DISPLAY_WIDTH}" style="display:block;width:100%;max-width:${CHART_DISPLAY_WIDTH}px;height:auto;border:0;">`;
}

const sum = (items: { amount: number }[]) => items.reduce((acc, t) => acc + t.amount, 0);

/**
 * Builds template vars (scalars + pre-rendered `__data_*` blocks) for a
 * scheduled report. Only the data blocks listed in `neededSources` are
 * rendered, so charts are generated only when the template uses them.
 */
export async function buildReport(
  config: ReportConfig,
  neededSources: Set<DataBlockSource>,
  now = new Date(),
): Promise<BuiltReport> {
  const vars: Record<string, unknown> = {
    reportName: config.name,
    generatedAtFormatted: formatInTimeZone(now, config.timezone ?? 'America/Sao_Paulo'),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '',
  };
  const attachments: EmailAttachment[] = [];
  let itemsCount = 0;

  if (config.reportType === 'PENDING_ITEMS_DIGEST') {
    const [transactions, installments, debts] = await Promise.all([
      config.includeOverdueTransactions ? getOverdueTransactions(config.workspaceId, now) : [],
      config.includeOverdueInstallments ? getOverdueInstallments(config.workspaceId, now) : [],
      config.includeOpenDebts ? getOpenDebts(config.workspaceId, now) : [],
    ]);

    const transactionsTotal = sum(transactions);
    const installmentsTotal = sum(installments);
    const debtsTotal = debts.reduce((acc, d) => acc + d.currentValue, 0);
    itemsCount = transactions.length + installments.length + debts.length;

    Object.assign(vars, {
      periodLabel: `Posição em ${formatInTimeZone(now, config.timezone ?? 'America/Sao_Paulo', {})}`,
      pendingItemsCount: transactions.length + installments.length,
      pendingItemsTotalFormatted: formatCurrency(transactionsTotal + installmentsTotal),
      overdueTransactionsCount: transactions.length,
      overdueTransactionsTotalFormatted: formatCurrency(transactionsTotal),
      overdueInstallmentsCount: installments.length,
      overdueInstallmentsTotalFormatted: formatCurrency(installmentsTotal),
      openDebtsCount: debts.length,
      openDebtsTotalFormatted: formatCurrency(debtsTotal),
      hasOverdueTransactions: transactions.length > 0 ? 'true' : '',
      hasOverdueInstallments: installments.length > 0 ? 'true' : '',
      hasOpenDebts: debts.length > 0 ? 'true' : '',
    });

    if (neededSources.has('overdueTransactionsTable')) {
      vars[dataBlockToken('overdueTransactionsTable')] = overdueTransactionsTable(transactions);
    }
    if (neededSources.has('overdueInstallmentsTable')) {
      vars[dataBlockToken('overdueInstallmentsTable')] = overdueInstallmentsTable(installments);
    }
    if (neededSources.has('openDebtsTable')) {
      vars[dataBlockToken('openDebtsTable')] = renderDataTable(
        ['Dívida', 'Status', 'Pagas', 'Saldo'],
        debts
          .slice(0, MAX_TABLE_ROWS)
          .map((d) => [
            escapeHtml(d.name) +
              (d.overdueInstallments > 0
                ? ` <span style="color:#dc2626;">(${d.overdueInstallments} em atraso)</span>`
                : ''),
            DEBT_STATUS_LABELS[d.status as DebtStatus] ?? d.status,
            d.installments ? `${d.paidInstallments}/${d.installments}` : String(d.paidInstallments),
            formatCurrency(d.currentValue),
          ]),
        moreFooter(debts.length),
      );
    }
  }

  if (config.reportType === 'EXPENSE_SUMMARY') {
    const days = config.summaryPeriodDays;
    const summary = await getExpenseSummary(config.workspaceId, days, now);
    itemsCount = summary.expenseCount;
    const variation =
      summary.previousExpenseTotal > 0
        ? ((summary.expenseTotal - summary.previousExpenseTotal) / summary.previousExpenseTotal) *
          100
        : null;

    Object.assign(vars, {
      periodLabel: `${fmtDate(summary.from)} a ${fmtDate(summary.to)}`,
      summaryExpenseTotalFormatted: formatCurrency(summary.expenseTotal),
      summaryIncomeTotalFormatted: formatCurrency(summary.incomeTotal),
      summaryBalanceFormatted: formatCurrency(summary.incomeTotal - summary.expenseTotal),
      summaryExpenseCount: summary.expenseCount,
      summaryVsPreviousPercent:
        variation === null
          ? 'sem base de comparação'
          : `${variation > 0 ? '+' : ''}${variation.toFixed(1).replace('.', ',')}%`,
      summaryTopCategoryName: summary.byCategory[0]?.name ?? '-',
      summaryDailyAverageFormatted: formatCurrency(summary.expenseTotal / Math.max(days, 1)),
    });

    if (neededSources.has('expenseByCategoryTable')) {
      const total = summary.expenseTotal || 1;
      vars[dataBlockToken('expenseByCategoryTable')] = renderDataTable(
        ['Categoria', '%', 'Valor'],
        summary.byCategory
          .slice(0, MAX_TABLE_ROWS)
          .map((c) => [
            escapeHtml(c.name),
            `${Math.round((c.value / total) * 100)}%`,
            formatCurrency(c.value),
          ]),
        moreFooter(summary.byCategory.length),
      );
    }
    if (neededSources.has('topExpensesTable')) {
      vars[dataBlockToken('topExpensesTable')] = renderDataTable(
        ['Descrição', 'Data', 'Valor'],
        summary.topExpenses.map((t) => [
          `${escapeHtml(t.description)}<br><span style="color:#64748b;font-size:12px;">${escapeHtml(t.categoryName)}</span>`,
          fmtDate(t.date),
          formatCurrency(t.amount),
        ]),
      );
    }
    if (neededSources.has('expenseByCategoryChart')) {
      attachments.push({
        filename: 'despesas-por-categoria.png',
        content: await renderCategoryBarChart(summary.byCategory),
        cid: 'chart-expense-by-category',
        contentType: 'image/png',
      });
      vars[dataBlockToken('expenseByCategoryChart')] = chartImg(
        'chart-expense-by-category',
        'Despesas por categoria',
      );
    }
    if (neededSources.has('dailyExpenseChart')) {
      attachments.push({
        filename: 'despesas-por-dia.png',
        content: await renderDailyColumnChart(
          summary.byDay.map((d) => ({
            label: days <= 7 ? format(d.date, 'EEEEEE', { locale: ptBR }) : format(d.date, 'dd'),
            value: d.value,
          })),
        ),
        cid: 'chart-daily-expense',
        contentType: 'image/png',
      });
      vars[dataBlockToken('dailyExpenseChart')] = chartImg(
        'chart-daily-expense',
        'Despesas por dia',
      );
    }
  }

  // Data blocks that don't apply to this report type render as an empty notice.
  for (const source of neededSources) {
    const key = dataBlockToken(source);
    if (!(key in vars)) {
      vars[key] =
        `<p style="margin:0;font-size:12px;color:#64748b;">Bloco não disponível para este tipo de relatório.</p>`;
    }
  }

  return { vars, attachments, itemsCount };
}

/** Data block sources referenced by a rendered body (`{{__data_<source>}}`). */
export function detectDataSources(html: string): Set<DataBlockSource> {
  const found = new Set<DataBlockSource>();
  for (const source of DATA_BLOCK_SOURCES) {
    if (html.includes(`{{${dataBlockToken(source)}}}`)) found.add(source);
  }
  return found;
}
