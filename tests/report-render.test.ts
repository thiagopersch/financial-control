import { DEFAULT_REPORT_TEMPLATES } from '@/lib/notification-templates/default-report-templates';
import { escapeHtml, renderDataTable } from '@/lib/notification-templates/data-sources';
import { applyConditionals, interpolate } from '@/lib/notification-templates/interpolate';
import {
  renderBlockTreePreviewHtml,
  renderBlockTreeToHtml,
} from '@/lib/notification-templates/render';
import { detectDataSources } from '@/lib/services/email-reports';
import { describe, expect, it } from 'vitest';

describe('blocos de dados do relatório', () => {
  it('o bloco de dados vira um token substituível', () => {
    const html = renderBlockTreeToHtml(DEFAULT_REPORT_TEMPLATES.PENDING_ITEMS_DIGEST.blocks);
    expect(html).toContain('{{__data_overdueTransactionsTable}}');
    expect([...detectDataSources(html)].sort()).toEqual(
      ['openDebtsTable', 'overdueInstallmentsTable', 'overdueTransactionsTable'].sort(),
    );
  });

  it('seções com visibleIf somem quando não há itens', () => {
    const html = renderBlockTreeToHtml(DEFAULT_REPORT_TEMPLATES.PENDING_ITEMS_DIGEST.blocks);
    const vars = { hasOverdueTransactions: 'true', hasOverdueInstallments: '', hasOpenDebts: '' };
    const out = interpolate(applyConditionals(html, vars), vars);
    expect(out).toContain('Transações vencidas');
    expect(out).not.toContain('Parcelas em atraso');
    expect(out).not.toContain('Dívidas em aberto');
  });

  it('o preview do editor preenche tokens com exemplo', () => {
    const html = renderBlockTreePreviewHtml(DEFAULT_REPORT_TEMPLATES.EXPENSE_SUMMARY.blocks);
    expect(html).not.toContain('{{__data_');
  });

  it('escapa texto do usuário (XSS)', () => {
    const table = renderDataTable(
      ['Descrição', 'Valor'],
      [[escapeHtml('<script>x</script>'), 'R$ 1']],
    );
    expect(table).not.toContain('<script>');
    expect(table).toContain('&lt;script&gt;');
  });

  it('imagens com caminho relativo viram URL absoluta', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.exemplo.com';
    const html = renderBlockTreeToHtml([
      {
        id: 'i',
        type: 'image',
        props: {
          src: '/uploads/notification-templates/x.png',
          alt: '',
          align: 'center',
          borderRadius: 0,
        },
      },
    ]);
    expect(html).toContain('src="https://app.exemplo.com/uploads/notification-templates/x.png"');
  });
});
