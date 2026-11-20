import { create } from 'zustand';

import {
  demoAccounts,
  demoTransactions,
} from '../mocks/bankData';

import type {
  Account,
  Transaction,
  TransferRequest,
  TransferResult,
} from '../types/bank';

interface BankState {
  accounts: Account[];
  transactions: Transaction[];

  createAccount: (name: string) => Account;

  transfer: (
    request: TransferRequest,
  ) => TransferResult;

  reset: () => void;
}

export const useBankStore = create<BankState>(
  (set, get) => ({
    accounts: demoAccounts.map((account) => ({
      ...account,
    })),

    transactions: demoTransactions.map((transaction) => ({
      ...transaction,
    })),

    createAccount: (name) => {
      const accountName = name.trim();

      if (!accountName) {
        throw new Error('계좌 이름을 입력해주세요.');
      }

      const { accounts } = get();

      const nextNumber =
        Math.max(
          3333000000000,
          ...accounts.map((account) =>
            Number(account.accountNumber),
          ),
        ) + 1;

      const account: Account = {
        id: crypto.randomUUID(),
        name: accountName,
        accountNumber: String(nextNumber),
        balance: 0,
        color: 'white',
      };

      set((state) => ({
        accounts: [...state.accounts, account],
      }));

      return account;
    },

    transfer: (request) => {
      const { accounts } = get();

      const {
        fromAccountId,
        toAccountNumber,
        amount,
        memo,
      } = request;

      const normalizedNumber =
        toAccountNumber.replace(/-/g, '').trim();

      const from = accounts.find(
        (account) => account.id === fromAccountId,
      );

      const to = accounts.find(
        (account) =>
          account.accountNumber === normalizedNumber,
      );

      if (!from) {
        throw new Error('출금 계좌를 확인해주세요.');
      }

      if (!to) {
        throw new Error(
          '이체할 수 없는 데모 계좌입니다.',
        );
      }

      if (from.id === to.id) {
        throw new Error(
          '출금 계좌와 입금 계좌가 동일합니다.',
        );
      }

      if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
      ) {
        throw new Error(
          '올바른 이체 금액을 입력해주세요.',
        );
      }

      if (from.balance < amount) {
        throw new Error('잔액이 부족합니다.');
      }

      if (!Number.isSafeInteger(to.balance + amount)) {
        throw new Error('입금 가능 금액을 초과했습니다.');
      }

      const transferId = crypto.randomUUID();
      const completedAt = new Date().toISOString();

      const updatedFrom: Account = {
        ...from,
        balance: from.balance - amount,
      };

      const updatedTo: Account = {
        ...to,
        balance: to.balance + amount,
      };

      const withdrawal: Transaction = {
        id: crypto.randomUUID(),
        accountId: from.id,
        type: 'WITHDRAWAL',
        title: memo?.trim() || to.name,
        amount,
        balanceAfter: updatedFrom.balance,
        createdAt: completedAt,
        transferId,
      };

      const deposit: Transaction = {
        id: crypto.randomUUID(),
        accountId: to.id,
        type: 'DEPOSIT',
        title: memo?.trim() || from.name,
        amount,
        balanceAfter: updatedTo.balance,
        createdAt: completedAt,
        transferId,
      };

      set((state) => ({
        accounts: state.accounts.map((account) => {
          if (account.id === from.id) {
            return updatedFrom;
          }

          if (account.id === to.id) {
            return updatedTo;
          }

          return account;
        }),

        transactions: [
          withdrawal,
          deposit,
          ...state.transactions,
        ],
      }));

      return {
        transferId,
        amount,
        fromAccount: updatedFrom,
        toAccount: updatedTo,
        completedAt,
      };
    },

    reset: () =>
      set({
        accounts: demoAccounts.map((account) => ({
          ...account,
        })),
        transactions: demoTransactions.map(
          (transaction) => ({
            ...transaction,
          }),
        ),
      }),
  }),
);
