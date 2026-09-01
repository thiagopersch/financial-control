/**
 * Captions em português para campos técnicos exibidos em UIs de auditoria/notificação.
 * Fonte única para não deixar `audit-view.tsx` e `notification-bell.tsx` divergirem.
 */
export const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  name: 'Nome',
  email: 'E-mail',
  amount: 'Valor',
  type: 'Tipo',
  status: 'Status',
  description: 'Descrição',
  categoryId: 'Categoria',
  accountId: 'Conta',
  costCenterId: 'Centro de Custo',
  supplierId: 'Fornecedor',
  notes: 'Observações',
  color: 'Cor',
  limit: 'Limite',
  closingDay: 'Dia de Fechamento',
  dueDay: 'Dia de Vencimento',
  initialBalance: 'Saldo Inicial',
  initialValue: 'Valor Inicial',
  currentValue: 'Valor Atual',
  interestRate: 'Taxa de Juros',
  minimumPayment: 'Pagamento Mínimo',
  installments: 'Parcelas',
  calculationType: 'Tipo de Cálculo',
  installmentValue: 'Valor da Parcela',
  firstInstallmentMonth: 'Primeira Parcela',
  dueDate: 'Data de Vencimento',
  date: 'Data',
  isActive: 'Ativo',
  isRecurring: 'Recorrente',
  recurrenceType: 'Tipo de Recorrência',
  targetAmount: 'Valor Alvo',
  currentAmount: 'Valor Atual',
  deadline: 'Prazo',
  permissionProfileId: 'Perfil de Permissão',
  permissionIds: 'Permissões',
  password: 'Senha',
  keyword: 'Palavra-chave',
  bio: 'Bio',
  fromAccountId: 'Conta Origem',
  toAccountId: 'Conta Destino',
  isPaid: 'Pago',
  paidAt: 'Data do Pagamento',
  createdAt: 'Criado em',
  updatedAt: 'Atualizado em',
  workspaceId: 'Workspace',
  parentTransactionId: 'Transação Pai',
  channel: 'Canal',
  subject: 'Assunto',
  bodyHtml: 'Corpo do E-mail',
  bodyWhatsapp: 'Mensagem do WhatsApp',
  content: 'Conteúdo',
  imageUrl: 'Imagem',
  isCreditCard: 'É Cartão de Crédito',
  accountIds: 'Contas Vinculadas',
  creditCardId: 'Cartão de Crédito',
  debtId: 'Dívida',
  paymentMethodId: 'Meio de Pagamento',
  month: 'Mês',
  year: 'Ano',
  alertAt80: 'Alertar em 80%',
  alertAt100: 'Alertar em 100%',
  level: 'Nível',
  link: 'Link',
  metadata: 'Detalhes',
  isRead: 'Lida',
  isSystem: 'Perfil de Sistema',
  autoMoveEnabled: 'Mover Automaticamente',
  dueName: 'Vinculada à dívida',
  debtName: 'Vinculada à dívida',
  budgetAmount: 'Orçamento',
  spentAmount: 'Gasto',
  percentage: 'Percentual',
  current: 'Atual',
  target: 'Meta',
  used: 'Usado',
  available: 'Disponível',
  cardName: 'Cartão',
  topCategory: 'Categoria que mais contribuiu',
  topCategoryAmount: 'Valor na Categoria',
};

/** Chaves que nunca devem ser exibidas cruas (IDs internos). */
export function isIdLikeKey(key: string): boolean {
  return /Id$/i.test(key);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Sempre retorna um caption em português (ou, na pior hipótese, uma versão
 * humanizada da chave) — nunca a chave técnica crua.
 */
export function formatFieldLabel(key: string): string {
  return FIELD_LABELS[key] || humanizeKey(key);
}
