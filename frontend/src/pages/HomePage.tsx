import { useNavigate } from 'react-router-dom';

import {
  Plus,
  ChevronRight,
  Wallet,
  ArrowLeftRight,
  History,
} from 'lucide-react';

import AccountCard from '../components/ui/AccountCard';

const demoAccounts = [
  {
    id: '1',
    name: '코코아뱅크 입출금통장',
    accountNumber: '3333000000001',
    balance: 1250000,
    color: 'yellow' as const,
  },
  {
    id: '2',
    name: '저축통장',
    accountNumber: '3333000000002',
    balance: 3500000,
    color: 'white' as const,
  },
];

export default function HomePage() {
  const navigate = useNavigate();

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

  return (
    <div className="space-y-5 px-5 pb-8 pt-2">

      {/* 사용자 정보 */}
      <section className="flex items-center justify-between">
        <div>
          <p className="text-sm text-bank-gray">
            안녕하세요
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            코코아님
          </h2>
        </div>

        <div
          className="
            flex h-12 w-12 items-center justify-center
            rounded-full bg-[#FFE680]
            text-lg font-bold
          "
        >
          K
        </div>
      </section>

      {/* 계좌 목록 */}
      <section className="space-y-3">
        {demoAccounts.map((account) => (
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
              navigate(`/transfer?accountId=${account.id}`)
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

      {/* 빠른 메뉴 */}
      <section className="rounded-2xl bg-white p-5">
        <h3 className="mb-5 text-base font-bold">
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

      {/* 서비스 안내 */}
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
