/**
 * Catalog of dynamic "data" blocks (lists/charts) for scheduled report e-mails
 * (lib/services/email-reports.ts). Flat `{{key}}` interpolation can't express
 * lists, so a data block renders to a single `{{__data_<source>}}` token which
 * the report service fills with pre-rendered, HTML-escaped markup (tables) or a
 * `cid:` image (charts) at delivery time.
 */

export const DATA_BLOCK_SOURCES = [
  'overdueTransactionsTable',
  'overdueInstallmentsTable',
  'openDebtsTable',
  'expenseByCategoryChart',
  'dailyExpenseChart',
  'expenseByCategoryTable',
  'topExpensesTable',
] as const;

export type DataBlockSource = (typeof DATA_BLOCK_SOURCES)[number];

export const DATA_BLOCK_SOURCE_LABELS: Record<DataBlockSource, string> = {
  overdueTransactionsTable: 'Tabela: transações vencidas',
  overdueInstallmentsTable: 'Tabela: parcelas em atraso',
  openDebtsTable: 'Tabela: dívidas em aberto',
  expenseByCategoryChart: 'Gráfico: despesas por categoria',
  dailyExpenseChart: 'Gráfico: despesas por dia',
  expenseByCategoryTable: 'Tabela: despesas por categoria',
  topExpensesTable: 'Tabela: maiores despesas',
};

export function dataBlockToken(source: DataBlockSource): string {
  return `__data_${source}`;
}

const cell = 'border-bottom:1px solid #e2e8f0;padding:8px;font-size:13px;';
const head = `${cell}background-color:#f8fafc;font-weight:600;text-align:left;`;

/** Shared email-safe table markup. Callers must pass already-escaped cell content. */
export function renderDataTable(headers: string[], rows: string[][], footer?: string): string {
  const headHtml = headers
    .map(
      (h, i) =>
        `<th style="${head}${i === headers.length - 1 ? 'text-align:right;' : ''}">${h}</th>`,
    )
    .join('');
  const bodyHtml = rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (c, i) =>
                  `<td style="${cell}${i === row.length - 1 ? 'text-align:right;white-space:nowrap;' : ''}">${c}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="${headers.length}" style="${cell}color:#64748b;text-align:center;">Nenhum item</td></tr>`;
  const footerHtml = footer
    ? `<tr><td colspan="${headers.length}" style="padding:8px;font-size:12px;color:#64748b;">${footer}</td></tr>`
    : '';
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${headHtml ? `<tr>${headHtml}</tr>` : ''}${bodyHtml}${footerHtml}</table>`;
}

function samplePlaceholderChart(label: string): string {
  const bars = [80, 55, 40, 25, 15]
    .map(
      (w) =>
        `<tr><td style="padding:3px 0;"><div style="background:#007a55;height:14px;width:${w}%;border-radius:3px;"></div></td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px dashed #cbd5e1;border-radius:6px;"><tr><td style="padding:12px;"><p style="margin:0 0 8px;font-size:12px;color:#64748b;">${label} (imagem gerada no envio)</p><table role="presentation" width="100%">${bars}</table></td></tr></table>`;
}

/** Static sample markup used by the builder canvas/preview (no real data). */
export const DATA_BLOCK_SAMPLE_HTML: Record<DataBlockSource, string> = {
  overdueTransactionsTable: renderDataTable(
    ['Descrição', 'Vencimento', 'Dias', 'Valor'],
    [
      ['Conta de luz', '05/10/2026', '12', 'R$ 245,90'],
      ['Internet', '10/10/2026', '7', 'R$ 119,90'],
    ],
  ),
  overdueInstallmentsTable: renderDataTable(
    ['Dívida', 'Parcela', 'Vencimento', 'Valor'],
    [
      ['Financiamento carro', '12/48', '01/10/2026', 'R$ 1.350,00'],
      ['Empréstimo', '3/10', '08/10/2026', 'R$ 520,00'],
    ],
  ),
  openDebtsTable: renderDataTable(
    ['Dívida', 'Status', 'Pagas', 'Saldo'],
    [
      ['Financiamento carro', 'Ativa', '11/48', 'R$ 49.950,00'],
      ['Empréstimo', 'Ativa', '2/10', 'R$ 4.160,00'],
    ],
  ),
  expenseByCategoryChart: samplePlaceholderChart('Despesas por categoria'),
  dailyExpenseChart: samplePlaceholderChart('Despesas por dia'),
  expenseByCategoryTable: renderDataTable(
    ['Categoria', '%', 'Valor'],
    [
      ['Alimentação', '38%', 'R$ 820,00'],
      ['Transporte', '21%', 'R$ 450,00'],
    ],
  ),
  topExpensesTable: renderDataTable(
    ['Descrição', 'Data', 'Valor'],
    [
      ['Supermercado', '14/10/2026', 'R$ 412,30'],
      ['Combustível', '12/10/2026', 'R$ 250,00'],
    ],
  ),
};

/** Vars that fill every data token with its sample markup (builder preview only). */
export function buildSampleDataVars(): Record<string, string> {
  return Object.fromEntries(
    DATA_BLOCK_SOURCES.map((s) => [dataBlockToken(s), DATA_BLOCK_SAMPLE_HTML[s]]),
  );
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
