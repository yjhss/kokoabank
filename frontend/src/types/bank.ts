export interface User {
  id: string;
  username: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  color: 'yellow' | 'white' | 'gray';
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  title: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  transferId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  memo?: string;
}

export interface TransferResult {
  transferId: string;
  amount: number;
  fromAccount: Account;
  toAccount: Account;
  completedAt: string;
}