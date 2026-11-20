import type {
  User,
  Account,
  Transaction,
} from '../types/bank';

export const demoUser: User = {
  id: 'user-1',
  username: 'demo',
  name: '코코아',
};

export const demoAccounts: Account[] = [
  {
    id: 'account-1',
    name: '코코아뱅크 입출금통장',
    accountNumber: '3333000000001',
    balance: 1250000,
    color: 'yellow',
  },
  {
    id: 'account-2',
    name: '저축통장',
    accountNumber: '3333000000002',
    balance: 3500000,
    color: 'white',
  },
];

export const demoTransactions: Transaction[] = [
  {
    id: 'transaction-1',
    accountId: 'account-1',
    type: 'WITHDRAWAL',
    title: '카페 결제',
    amount: 5500,
    balanceAfter: 1250000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'transaction-2',
    accountId: 'account-1',
    type: 'DEPOSIT',
    title: '급여 입금',
    amount: 1000000,
    balanceAfter: 1255500,
    createdAt: new Date(
      Date.now() - 86400000,
    ).toISOString(),
  },
  {
    id: 'transaction-3',
    accountId: 'account-2',
    type: 'DEPOSIT',
    title: '저축 입금',
    amount: 500000,
    balanceAfter: 3500000,
    createdAt: new Date(
      Date.now() - 172800000,
    ).toISOString(),
  },
];
