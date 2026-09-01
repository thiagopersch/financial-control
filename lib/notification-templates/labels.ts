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
  TRANSACTION_DUE_SOON: 'Transação a vencer',
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
