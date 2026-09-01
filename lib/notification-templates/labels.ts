export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  BUDGET_WARNING: 'Alerta de orçamento',
  BUDGET_EXCEEDED: 'Orçamento excedido',
  INVOICE_DUE: 'Fatura a vencer',
  INVOICE_OVERDUE: 'Fatura vencida',
  GOAL_PROGRESS: 'Progresso de meta',
  DEBT_ALERT: 'Alerta de dívida',
  DEBT_DUE_SOON: 'Dívida a vencer',
  DEBT_OVERDUE: 'Dívida vencida',
  RECURRING_REMINDER: 'Lembrete recorrente',
  TRANSACTION_CREATED: 'Nova transação',
  TRANSACTION_PENDING: 'Transação pendente',
  TRANSACTION_DUE_SOON: 'Transação a vencer',
  TRANSACTION_PAID: 'Transação paga',
  TRANSACTION_OVERDUE: 'Transação vencida',
  ANOMALY_DETECTED: 'Anomalia detectada',
  CARD_LIMIT_WARNING: 'Cartão perto do limite',
  CARD_LIMIT_EXCEEDED: 'Limite do cartão estourado',
  SYSTEM: 'Geral / Automação',
};

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
};

/** Agrupamento por categoria para o seletor de gatilho (builder de templates). */
export const NOTIFICATION_TYPE_GROUPS: { label: string; types: string[] }[] = [
  {
    label: 'Transações',
    types: [
      'TRANSACTION_CREATED',
      'TRANSACTION_PAID',
      'TRANSACTION_PENDING',
      'TRANSACTION_DUE_SOON',
      'TRANSACTION_OVERDUE',
    ],
  },
  {
    label: 'Dívidas',
    types: ['DEBT_ALERT', 'DEBT_DUE_SOON', 'DEBT_OVERDUE'],
  },
  {
    label: 'Orçamento',
    types: ['BUDGET_WARNING', 'BUDGET_EXCEEDED'],
  },
  {
    label: 'Cartão de Crédito',
    types: ['CARD_LIMIT_WARNING', 'CARD_LIMIT_EXCEEDED'],
  },
  {
    label: 'Faturas',
    types: ['INVOICE_DUE', 'INVOICE_OVERDUE'],
  },
  {
    label: 'Metas',
    types: ['GOAL_PROGRESS'],
  },
  {
    label: 'Outros',
    types: ['RECURRING_REMINDER', 'ANOMALY_DETECTED', 'SYSTEM'],
  },
];

export function getSortedNotificationTypeGroups() {
  return NOTIFICATION_TYPE_GROUPS.map((group) => ({
    label: group.label,
    types: [...group.types].sort((a, b) =>
      (NOTIFICATION_TYPE_LABELS[a] || a).localeCompare(NOTIFICATION_TYPE_LABELS[b] || b, 'pt-BR'),
    ),
  }));
}
