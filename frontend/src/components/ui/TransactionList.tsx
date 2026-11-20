import {
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
} from 'lucide-react';

import type { Transaction } from '../../types/bank';
import {
  formatDateTime,
  formatWon,
} from '../../utils/format';

interface TransactionListProps {
  transactions: Transaction[];
  showBalance?: boolean;
}

export default function TransactionList({
  transactions,
  showBalance = true,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-12 text-center">
        <ReceiptText
          size={32}
          className="mx-auto mb-3 text-bank-gray"
        />

        <p className="text-sm text-bank-gray">
          거래내역이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-bank-border rounded-2xl bg-white">
      {transactions.map((transaction) => {
        const isDeposit =
          transaction.type === 'DEPOSIT';

        return (
          <div
            key={transaction.id}
            className="flex items-center gap-3 px-4 py-5"
          >
            <div
              className={`
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-full
                ${
                  isDeposit
                    ? 'bg-blue-50 text-bank-blue'
                    : 'bg-bank-background'
                }
              `}
            >
              {isDeposit ? (
                <ArrowDownLeft size={20} />
              ) : (
                <ArrowUpRight size={20} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {transaction.title}
              </p>

              <p className="mt-1 text-xs text-bank-gray">
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`
                  text-sm font-semibold
                  ${
                    isDeposit
                      ? 'text-bank-blue'
                      : 'text-bank-black'
                  }
                `}
              >
                {isDeposit ? '+' : '-'}
                {formatWon(transaction.amount)}
              </p>

              {showBalance && (
                <p className="mt-1 text-xs text-bank-gray">
                  {formatWon(transaction.balanceAfter)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
