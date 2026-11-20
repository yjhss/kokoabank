import {
  useSearchParams,
} from 'react-router-dom';

import { useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import TransactionList from '../components/ui/TransactionList';

import { useAccounts } from '../features/account/accountApi';
import { useTransactions } from '../features/transaction/transactionApi';

type Filter = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL';

const filters: {
  value: Filter;
  label: string;
}[] = [
  { value: 'ALL', label: '전체' },
  { value: 'DEPOSIT', label: '입금' },
  { value: 'WITHDRAWAL', label: '출금' },
];

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();

  const accounts = useAccounts();
  const transactions = useTransactions();

  const [filter, setFilter] =
    useState<Filter>('ALL');

  const [accountId, setAccountId] = useState(
    searchParams.get('accountId') || 'ALL',
  );

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const matchesAccount =
        accountId === 'ALL' ||
        transaction.accountId === accountId;

      const matchesType =
        filter === 'ALL' ||
        transaction.type === filter;

      return matchesAccount && matchesType;
    },
  );

  return (
    <div className="px-5 pb-8 pt-5">
      <PageHeader
        title="거래내역"
        description="계좌의 입출금 내역을 확인하세요."
      />

      <section className="mb-5 rounded-2xl bg-white p-4">
        <label
          htmlFor="transaction-account"
          className="mb-2 block text-xs text-bank-gray"
        >
          조회 계좌
        </label>

        <select
          id="transaction-account"
          value={accountId}
          onChange={(event) =>
            setAccountId(event.target.value)
          }
          className="
            w-full rounded-xl border
            border-bank-border bg-white p-3
            text-sm outline-none
          "
        >
          <option value="ALL">전체 계좌</option>

          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
            >
              {account.name}
            </option>
          ))}
        </select>
      </section>

      <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-[#E8EBED] p-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`
              rounded-lg py-2.5 text-sm
              transition-colors
              ${
                filter === item.value
                  ? 'bg-white font-semibold shadow-sm'
                  : 'text-bank-gray'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex justify-between">
        <p className="text-sm text-bank-gray">
          총 {filteredTransactions.length}건
        </p>

        <p className="text-xs text-bank-gray">
          최신순
        </p>
      </div>

      <TransactionList
        transactions={filteredTransactions}
        showBalance={accountId !== 'ALL'}
      />
    </div>
  );
}
