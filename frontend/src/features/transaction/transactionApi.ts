import { useBankStore } from '../../stores/bankStore';

export function useTransactions(accountId?: string) {
  const transactions = useBankStore(
    (state) => state.transactions,
  );

  return accountId
    ? transactions.filter(
        (transaction) =>
          transaction.accountId === accountId,
      )
    : transactions;
}
