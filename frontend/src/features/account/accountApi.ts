import { useBankStore } from '../../stores/bankStore';

export function useAccounts() {
  return useBankStore((state) => state.accounts);
}

export function useAccount(accountId?: string) {
  return useBankStore((state) =>
    state.accounts.find(
      (account) => account.id === accountId,
    ),
  );
}

export function createAccount(name: string) {
  return useBankStore.getState().createAccount(name);
}
