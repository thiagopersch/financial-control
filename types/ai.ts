export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  workspaceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialContext {
  accounts: {
    name: string;
    balance: number;
    type: string;
  }[];
  creditCards: {
    name: string;
    limit: number;
    currentBalance: number;
    dueDate: number;
    closingDate: number;
  }[];
  budgets: {
    category: string;
    amount: number;
    spent: number;
    percentage: number;
  }[];
  debts: {
    name: string;
    totalAmount: number;
    remainingAmount: number;
    monthlyPayment: number;
    interestRate: number;
  }[];
  goals: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    percentage: number;
  }[];
  monthlySummary: {
    income: number;
    expenses: number;
    balance: number;
  };
  recentTransactions: {
    date: string;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: string;
  }[];
  cashFlowProjection: {
    next30Days: {
      income: number;
      expenses: number;
    };
  };
}

export interface ChatResponse {
  success: boolean;
  message?: AIMessage;
  conversationId?: string;
  error?: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}
