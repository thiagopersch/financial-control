import { CreditCard } from '@/types/credit-card';
import { BankAccount, Transaction, Transfer, Workspace } from '@prisma/client';

export interface Account {
  id: string;
  name: string;
  type: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
  workspaceId?: string;
  workspace?: Workspace;
  transactions?: Transaction[];
  transfersFrom?: Transfer[];
  transfersTo?: Transfer[];
  creditCardDetails?: CreditCard;
  bankAccount?: BankAccount;
}
