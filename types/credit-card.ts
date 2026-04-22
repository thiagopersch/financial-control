import { Invoice } from '@prisma/client';
import { Account } from './account';

export interface CreditCard {
  id: string;
  accountId: string;
  account: Account;
  limit: number;
  initialBalance: number;
  usedAmount: number;
  closingDay: number;
  dueDay: number;
  color: string;
  invoices: Invoice[];
  createdAt: string;
  updatedAt: string;
}
