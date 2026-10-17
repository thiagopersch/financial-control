import type { EmailReportType } from '@prisma/client';
import type { BlockTree, ColumnChildBlock, ContainerBlock, DataBlock } from './block-types';
import type { DataBlockSource } from './data-sources';

/**
 * Built-in templates for scheduled report e-mails: used when a schedule has no
 * custom template, and offered as a starting point in the template builder.
 * Stable ids keep the tree deterministic (no crypto in module scope).
 */

const text = (id: string, html: string): ColumnChildBlock => ({
  id,
  type: 'text',
  props: { html },
});

const data = (id: string, source: DataBlockSource): DataBlock => ({
  id,
  type: 'data',
  props: { source },
});

const section = (
  id: string,
  children: ColumnChildBlock[],
  visibleIf?: string,
  backgroundColor = 'transparent',
): ContainerBlock => ({
  id,
  type: 'container',
  props: { marginY: 8, marginX: 0, paddingY: 12, paddingX: 16, backgroundColor, visibleIf },
  children,
});

const button = (id: string): ColumnChildBlock => ({
  id,
  type: 'button',
  props: {
    label: 'Abrir o sistema',
    href: 'app-slug:/transactions',
    bgColor: 'app-primary',
    textColor: '#ffffff',
    radius: 6,
    paddingY: 10,
    paddingX: 20,
    align: 'center',
  },
});

const PENDING_ITEMS_BLOCKS: BlockTree = [
  section(
    'hdr',
    [
      text(
        'hdr-t',
        '<h2>Você tem pendências financeiras</h2><p>{{periodLabel}} · {{reportName}}</p>',
      ),
    ],
    undefined,
    '#f1f5f9',
  ),
  section(
    'tx',
    [
      text(
        'tx-t',
        '<h3>Transações vencidas</h3><p><strong>{{overdueTransactionsCount}}</strong> em atraso, somando <strong>{{overdueTransactionsTotalFormatted}}</strong>.</p>',
      ),
      data('tx-d', 'overdueTransactionsTable'),
    ],
    'hasOverdueTransactions',
  ),
  section(
    'inst',
    [
      text(
        'inst-t',
        '<h3>Parcelas em atraso</h3><p><strong>{{overdueInstallmentsCount}}</strong> parcela(s), somando <strong>{{overdueInstallmentsTotalFormatted}}</strong>.</p>',
      ),
      data('inst-d', 'overdueInstallmentsTable'),
    ],
    'hasOverdueInstallments',
  ),
  section(
    'debts',
    [
      text(
        'debts-t',
        '<h3>Dívidas em aberto</h3><p><strong>{{openDebtsCount}}</strong> dívida(s) com saldo de <strong>{{openDebtsTotalFormatted}}</strong>.</p>',
      ),
      data('debts-d', 'openDebtsTable'),
    ],
    'hasOpenDebts',
  ),
  section('cta', [button('cta-b')]),
  text('ftr', '<p style="font-size:12px;color:#64748b;">Gerado em {{generatedAtFormatted}}.</p>'),
];

const EXPENSE_SUMMARY_BLOCKS: BlockTree = [
  section(
    'hdr',
    [text('hdr-t', '<h2>Resumo de despesas</h2><p>{{periodLabel}}</p>')],
    undefined,
    '#f1f5f9',
  ),
  section('kpi', [
    text(
      'kpi-t',
      '<p>Despesas: <strong>{{summaryExpenseTotalFormatted}}</strong> ({{summaryExpenseCount}} lançamentos)<br>Receitas: <strong>{{summaryIncomeTotalFormatted}}</strong><br>Saldo do período: <strong>{{summaryBalanceFormatted}}</strong><br>Variação vs. período anterior: <strong>{{summaryVsPreviousPercent}}</strong><br>Média diária: <strong>{{summaryDailyAverageFormatted}}</strong></p>',
    ),
  ]),
  section('daily', [
    text('daily-t', '<h3>Despesas por dia</h3>'),
    data('daily-d', 'dailyExpenseChart'),
  ]),
  section('cat', [
    text(
      'cat-t',
      '<h3>Despesas por categoria</h3><p>Maior gasto: <strong>{{summaryTopCategoryName}}</strong></p>',
    ),
    data('cat-d', 'expenseByCategoryChart'),
    data('cat-tb', 'expenseByCategoryTable'),
  ]),
  section('top', [text('top-t', '<h3>Maiores despesas</h3>'), data('top-d', 'topExpensesTable')]),
  section('cta', [button('cta-b')]),
  text('ftr', '<p style="font-size:12px;color:#64748b;">Gerado em {{generatedAtFormatted}}.</p>'),
];

export const DEFAULT_REPORT_TEMPLATES: Record<
  EmailReportType,
  { name: string; subject: string; blocks: BlockTree }
> = {
  PENDING_ITEMS_DIGEST: {
    name: 'Lembrete de pendências (padrão)',
    subject: 'Lembrete: {{pendingItemsCount}} pendência(s) somando {{pendingItemsTotalFormatted}}',
    blocks: PENDING_ITEMS_BLOCKS,
  },
  EXPENSE_SUMMARY: {
    name: 'Resumo de despesas (padrão)',
    subject: 'Resumo de despesas · {{periodLabel}} · {{summaryExpenseTotalFormatted}}',
    blocks: EXPENSE_SUMMARY_BLOCKS,
  },
};

export const REPORT_TYPE_LABELS: Record<EmailReportType, string> = {
  PENDING_ITEMS_DIGEST: 'Lembrete de pendências',
  EXPENSE_SUMMARY: 'Resumo de despesas',
};
