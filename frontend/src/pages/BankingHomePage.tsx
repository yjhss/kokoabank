import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Gift,
  Landmark,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import {
  canAccessPlatform,
  getCurrentUser,
  logout,
} from '../features/auth/api';

export default function BankingHomePage() {
  const reduceMotion = useReducedMotion();

  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
  });

  const cards = [
    {
      title: '가상 계좌',
      description: '가상 계좌 생성 및 잔액 조회',
      icon: Landmark,
    },
    {
      title: '가상 계좌이체',
      description: '금융거래 트랜잭션 검증',
      icon: ArrowLeftRight,
    },
    {
      title: '카드 캐시백',
      description: '가상 카드 결제 및 랜덤 리워드',
      icon: Gift,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/banking" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE500] font-black">
              K
            </div>

            <div>
              <p className="font-bold">KokoaBank</p>
              <p className="text-xs text-slate-500">
                Banking Simulation
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Banking Service
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              금융 시뮬레이션
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              가상 금융거래를 활용하여 트랜잭션과 서비스 안정성을 검증합니다.
            </p>
          </div>

          {user && canAccessPlatform(user.role) && (
            <Link
              to="/"
              className="rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold"
            >
              Developer Portal 이동
            </Link>
          )}

          <Link
            to="/rewards"
            className="inline-flex items-center justify-center rounded-xl bg-[#FEE500] px-5 py-3 text-sm font-semibold text-[#191919]"
            >
            랜덤 캐시백 이용하기
            </Link>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-amber-700"
          />

          <div>
            <p className="font-semibold text-amber-900">
              테스트용 가상 금융서비스
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              모든 계좌 잔액과 거래는 시뮬레이션 데이터입니다.
              실제 입출금, 카드 결제 또는 현금 지급이 발생하지 않습니다.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 16 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.06,
              }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF5BD]">
                <card.icon size={23} />
              </div>

              <h2 className="mt-6 text-lg font-bold">
                {card.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {card.description}
              </p>

              <span className="mt-6 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                API 연동 예정
              </span>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
