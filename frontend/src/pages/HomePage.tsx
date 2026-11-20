import { useNavigate } from 'react-router-dom';

import {
  Plus,
  ChevronRight,
  Wallet,
  ArrowLeftRight,
  History,
} from 'lucide-react';

import AccountCard from '../components/ui/AccountCard';

import { useAccounts } from '../features/account/accountApi';
import { useAuthStore } from '../stores/authStore';
import { formatWon } from '../utils/format';

const quickActions = [
  {
    label: '계좌 관리',
    icon: Wallet,
    path: '/accounts',
  },
  {
    label: '이체',
    icon: ArrowLeftRight,
    path: '/transfer',
  },
  {
    label: '거래내역',
    icon: History,
    path: '/transactions',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const accounts = useAccounts();

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  return (
    <div className="space-y-5 px-5 pb-8 pt-2">
      <section className="flex items-center justify-between">
        <div>
          <p className="text-sm text-bank-gray">
            안녕하세요
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {user?.name}님
          </h2>
        </div>

        <div
          className="
            flex h-12 w-12 items-center
            justify-center rounded-full
            bg-[#FFE680] text-lg font-bold
          "
        >
          {user?.name.charAt(0) || 'K'}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5">
        <p className="text-sm text-bank-gray">
          내 총자산
        </p>

        <p className="mt-2 text-3xl font-bold tracking-tight">
          {formatWon(totalBalance)}
        </p>
      </section>

      <section className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            name={account.name}
            accountNumber={account.accountNumber}
            balance={account.balance}
            color={account.color}
            onDetail={() =>
              navigate(`/accounts/${account.id}`)
            }
            onTransfer={() =>
              navigate(
                `/transfer?accountId=${account.id}`,
              )
            }
          />
        ))}

        <button
          type="button"
          onClick={() => navigate('/accounts')}
          className="
            flex w-full items-center justify-center gap-2
            rounded-2xl border border-dashed
            border-gray-300 py-5 text-bank-gray
          "
        >
          <Plus size={20} />
          <span className="text-sm">계좌 추가</span>
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5">
        <h3 className="mb-5 font-bold">
          자주 쓰는 메뉴
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.path}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="
                    flex h-12 w-12 items-center
                    justify-center rounded-2xl
                    bg-bank-background
                  "
                >
                  <Icon size={23} strokeWidth={1.8} />
                </div>

                <span className="text-xs">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="
          flex items-center justify-between
          rounded-2xl bg-[#FFF4BA] p-5
        "
      >
        <div>
          <p className="text-xs text-black/50">
            KOKOABANK PROJECT
          </p>

          <p className="mt-2 font-semibold">
            더 편리하고 안전한 금융
          </p>
        </div>

        <ChevronRight size={20} />
      </section>

      <p className="text-center text-[11px] text-bank-gray">
        데모 계좌 및 가상 거래 데이터를 사용합니다.
      </p>
    </div>
  );
}
