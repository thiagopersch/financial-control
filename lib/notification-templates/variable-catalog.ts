/**
 * Static catalog of variables available for the "Adicionar variável" picker.
 *
 * Tokens are always inserted as flat `{{key}}` placeholders (no dots), because
 * lib/notification-templates/interpolate.ts interpolates with the regex
 * `\{\{(\w+)\}\}`, which does not support dotted paths.
 *
 * Each page id doubles as an "entity type" (transaction/account/paymentMethod/
 * creditCard/debt/budget/goal/user/general) — this is what the test-send
 * feature (lib/actions/notification-template-test-send.ts) uses to figure out
 * which record pickers to show for a given template. Do not rename a page id
 * without checking `detectTemplateEntityPages` callers.
 *
 * Backward compatibility: fields marked "legacy" already exist in real
 * automated notification metadata (lib/actions/notifications.ts) and/or in
 * templates users may have already created — never rename or remove them.
 * New fields are added under distinct, entity-prefixed keys instead, even
 * though this means some concepts (e.g. "amount") appear more than once
 * across pages under different keys — that's an accepted tradeoff for zero
 * breakage over strict naming purity.
 */

export interface VariableCatalogField {
  key: string;
  label: string;
}

export interface VariableCatalogPage {
  id: string;
  label: string;
  fields: VariableCatalogField[];
}

export const VARIABLE_CATALOG: VariableCatalogPage[] = [
  {
    id: 'user',
    label: 'Destinatário',
    fields: [{ key: 'recipientName', label: 'Nome do destinatário' }],
  },
  {
    id: 'transaction',
    label: 'Transações',
    fields: [
      // legacy
      { key: 'transactionId', label: 'ID da transação' },
      { key: 'name', label: 'Descrição' },
      { key: 'amount', label: 'Valor' },
      { key: 'dueDate', label: 'Vencimento' },
      { key: 'isRecurring', label: 'É recorrente' },
      { key: 'debtName', label: 'Dívida associada' },
      // new
      { key: 'transactionType', label: 'Tipo (Receita/Despesa)' },
      { key: 'transactionStatus', label: 'Status' },
      { key: 'transactionAccountName', label: 'Conta' },
      { key: 'transactionPaymentMethodName', label: 'Meio de pagamento' },
      { key: 'transactionCreditCardName', label: 'Cartão de crédito' },
      { key: 'transactionCategoryName', label: 'Categoria' },
      { key: 'transactionAmount', label: 'Valor (numérico)' },
      { key: 'transactionAmountFormatted', label: 'Valor (formatado em R$)' },
      { key: 'transactionDueDate', label: 'Data de vencimento' },
      { key: 'transactionPaidDate', label: 'Data de pagamento' },
      { key: 'transactionCostCenterName', label: 'Centro de custo' },
      { key: 'transactionSupplierName', label: 'Fornecedor' },
      { key: 'transactionNotes', label: 'Observação' },
      { key: 'transactionHasDebt', label: 'Vinculada a uma dívida (sim/não)' },
    ],
  },
  {
    id: 'account',
    label: 'Contas',
    fields: [
      { key: 'accountName', label: 'Nome' },
      { key: 'accountType', label: 'Tipo' },
      { key: 'accountColor', label: 'Cor' },
    ],
  },
  {
    id: 'paymentMethod',
    label: 'Meios de pagamento',
    fields: [
      { key: 'paymentMethodName', label: 'Nome' },
      { key: 'paymentMethodColor', label: 'Cor' },
      { key: 'paymentMethodIsCreditCard', label: 'É cartão de crédito' },
      { key: 'paymentMethodAccountNames', label: 'Contas vinculadas' },
    ],
  },
  {
    id: 'creditCard',
    label: 'Cartão de crédito',
    fields: [
      // legacy (was page "invoice")
      { key: 'invoiceId', label: 'ID da fatura' },
      { key: 'creditCardId', label: 'ID do cartão' },
      { key: 'accountId', label: 'ID da conta' },
      { key: 'cardName', label: 'Nome do cartão' },
      { key: 'amount', label: 'Valor da fatura' },
      { key: 'used', label: 'Usado no limite' },
      { key: 'limit', label: 'Limite total' },
      { key: 'available', label: 'Limite disponível' },
      { key: 'percentage', label: 'Percentual usado' },
      // new
      { key: 'creditCardAccountName', label: 'Nome da conta vinculada' },
      { key: 'creditCardLimit', label: 'Limite do cartão' },
      { key: 'creditCardAvailableLimit', label: 'Limite disponível (ou "Sem Limite")' },
      { key: 'creditCardClosingDay', label: 'Dia do fechamento' },
      { key: 'creditCardDueDay', label: 'Dia do vencimento' },
      { key: 'creditCardColor', label: 'Cor' },
    ],
  },
  {
    id: 'debt',
    label: 'Dívidas',
    fields: [
      { key: 'debtName', label: 'Nome' },
      { key: 'debtAccountName', label: 'Conta' },
      { key: 'debtSupplierName', label: 'Fornecedor' },
      { key: 'debtCategoryName', label: 'Categoria' },
      { key: 'debtPaymentMethodName', label: 'Meio de pagamento' },
      { key: 'debtCreditCardName', label: 'Cartão vinculado' },
      { key: 'debtInitialValue', label: 'Valor inicial (numérico)' },
      { key: 'debtInitialValueFormatted', label: 'Valor inicial (formatado)' },
      { key: 'debtCalculationType', label: 'Tipo de cálculo' },
      { key: 'debtInstallmentValue', label: 'Valor da parcela (numérico)' },
      { key: 'debtInstallmentValueFormatted', label: 'Valor da parcela (formatado)' },
      { key: 'debtInstallments', label: 'Quantidade de parcelas' },
      { key: 'debtFirstInstallmentMonth', label: 'Primeira parcela' },
      { key: 'debtDueDay', label: 'Dia de vencimento' },
      { key: 'debtDescription', label: 'Descrição' },
    ],
  },
  {
    id: 'budget',
    label: 'Orçamentos',
    fields: [
      // legacy
      { key: 'budgetId', label: 'ID do orçamento' },
      { key: 'categoryId', label: 'ID da categoria' },
      { key: 'spentAmount', label: 'Valor gasto' },
      { key: 'budgetAmount', label: 'Valor do orçamento' },
      { key: 'percentage', label: 'Percentual do orçamento' },
      // new
      { key: 'budgetCategoryName', label: 'Nome da categoria' },
      { key: 'budgetAmountFormatted', label: 'Valor do orçamento (formatado)' },
      { key: 'budgetMonth', label: 'Mês' },
      { key: 'budgetYear', label: 'Ano' },
    ],
  },
  {
    id: 'goal',
    label: 'Metas',
    fields: [
      // legacy
      { key: 'goalId', label: 'ID da meta' },
      { key: 'current', label: 'Valor atual' },
      { key: 'target', label: 'Valor da meta' },
      { key: 'percentage', label: 'Percentual atingido' },
      // new
      { key: 'goalName', label: 'Nome' },
      { key: 'goalCurrentFormatted', label: 'Valor atual (formatado)' },
      { key: 'goalTargetFormatted', label: 'Valor alvo (formatado)' },
      { key: 'goalDeadline', label: 'Prazo' },
    ],
  },
  {
    id: 'general',
    label: 'Geral',
    fields: [
      { key: 'title', label: 'Título da notificação' },
      { key: 'message', label: 'Mensagem' },
    ],
  },
];

/** Flat list of all catalog fields, e.g. for feeding the RichTextEditor's legacy `variables` prop. */
export function flattenVariableCatalog(): VariableCatalogField[] {
  const seen = new Set<string>();
  const result: VariableCatalogField[] = [];
  for (const page of VARIABLE_CATALOG) {
    for (const field of page.fields) {
      if (seen.has(field.key)) continue;
      seen.add(field.key);
      result.push(field);
    }
  }
  return result;
}

/** Maps every catalog field key to its owning page id. First page wins for duplicate keys. */
export function buildKeyToPageIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const page of VARIABLE_CATALOG) {
    for (const field of page.fields) {
      if (!index.has(field.key)) index.set(field.key, page.id);
    }
  }
  return index;
}

/**
 * Scans a template's subject/bodyHtml/bodyWhatsapp for `{{key}}` tokens and
 * returns the distinct catalog page ids referenced (used by the test-send
 * feature to decide which entity pickers to show).
 */
export function detectTemplateEntityPages(template: {
  subject: string;
  bodyHtml: string;
  bodyWhatsapp: string;
}): string[] {
  const keyToPage = buildKeyToPageIndex();
  const found = new Set<string>();
  const text = `${template.subject}\n${template.bodyHtml}\n${template.bodyWhatsapp}`;
  for (const match of text.matchAll(/\{\{(\w+)\}\}/g)) {
    const page = keyToPage.get(match[1]);
    if (page) found.add(page);
  }
  return [...found];
}
