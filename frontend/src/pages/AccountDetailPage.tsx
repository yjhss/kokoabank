import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import TransactionList from '../components/ui/TransactionList';

import { useAccount } from '../features/account/accountApi';
import { useTransactions } from '../features/transaction/transactionApi';

import {
  formatAccountNumber,
  formatWon,
} from '../utils/format';

export default function AccountDetailPage() {
  const navigate = useNavigate();
  const { accountId } = useParams();

  const account = useAccount(accountId);
  const transactions = useTransactions(accountId);

  if (!account) {
    return (
      <div className="px-5 py-10">
        <PageHeader
          title="계좌를 찾을 수 없습니다."
          backTo="/accounts"
        />

        <Button onClick={() => navigate('/accounts')}>
          계좌 목록
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5 pb-8 pt-5">
      <PageHeader
        title="계좌 상세"
        backTo="/accounts"
      />

      <section
        className={`
          rounded-2xl p-6
          ${
            account.color === 'yellow'
              ? 'bg-bank-yellow'
              : 'bg-white'
          }
        `}
      >
        <p className="font-semibold">
          {account.name}
        </p>

        <p className="mt-2 text-xs text-black/50">
          {formatAccountNumber(account.accountNumber)}
        </p>

        <div className="py-7">
          <p className="text-sm text-black/50">
            출금 가능 금액
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatWon(account.balance)}
          </p>
        </div>

        <Button
          variant="dark"
          fullWidth
          onClick={() =>
            navigate(
              `/transfer?accountId=${account.id}`,
            )
          }
        >
          이체하기
        </Button>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">거래내역</h3>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/transactions?accountId=${account.id}`,
              )
            }
            className="text-sm text-bank-gray"
          >
            전체보기
          </button>
        </div>

        <TransactionList
          transactions={transactions.slice(0, 10)}
        />
      </section>
    </div>
  );
}
