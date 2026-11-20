import {
  Wallet,
  ArrowLeftRight,
  History,
  LogOut,
  ChevronRight,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

import { useAuthStore } from '../stores/authStore';
import { logout } from '../features/auth/authApi';

const menus = [
  {
    label: '내 계좌 관리',
    icon: Wallet,
    path: '/accounts',
  },
  {
    label: '계좌이체',
    icon: ArrowLeftRight,
    path: '/transfer',
  },
  {
    label: '거래내역 조회',
    icon: History,
    path: '/transactions',
  },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-5 px-5 pb-8 pt-5">
      <PageHeader title="전체 메뉴" />

      <section className="flex items-center gap-4 rounded-2xl bg-white p-5">
        <div
          className="
            flex h-14 w-14 items-center
            justify-center rounded-full
            bg-bank-yellow text-xl font-bold
          "
        >
          {user?.name.charAt(0) || 'K'}
        </div>

        <div>
          <p className="text-lg font-bold">
            {user?.name}님
          </p>

          <p className="mt-1 text-sm text-bank-gray">
            {user?.username}
          </p>
        </div>
      </section>

      <section className="divide-y divide-bank-border rounded-2xl bg-white px-5">
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <button
              key={menu.path}
              type="button"
              onClick={() => navigate(menu.path)}
              className="flex w-full items-center gap-3 py-5"
            >
              <Icon size={22} strokeWidth={1.8} />

              <span className="flex-1 text-left text-sm font-medium">
                {menu.label}
              </span>

              <ChevronRight
                size={18}
                className="text-bank-gray"
              />
            </button>
          );
        })}
      </section>

      <Button
        variant="outline"
        fullWidth
        onClick={handleLogout}
        className="gap-2"
      >
        <LogOut size={18} />
        로그아웃
      </Button>

      <section className="py-5 text-center">
        <p className="text-sm font-semibold">
          KokoaBank
        </p>

        <p className="mt-1 text-xs text-bank-gray">
          Internet Banking &amp; DevOps Platform
        </p>

        <p className="mt-2 text-xs text-bank-gray">
          학습 및 기술 실험을 위한 데모 서비스입니다.
        </p>
      </section>
    </div>
  );
}
