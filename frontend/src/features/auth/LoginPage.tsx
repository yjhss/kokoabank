import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import {
  canAccessPlatform,
  getCurrentUser,
  loginWithKakao,
} from './api';

export default function LoginPage() {
  const reduceMotion = useReducedMotion();

  const {
    data: user,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 0,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <p className="text-sm text-slate-500">
          로그인 상태를 확인하고 있습니다.
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={canAccessPlatform(user.role) ? '/' : '/banking'}
        replace
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-10">
      <motion.section
        initial={
          reduceMotion
            ? false
            : { opacity: 0, y: 24 }
        }
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEE500] text-3xl font-black text-[#191919]">
            K
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
            KokoaBank
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Cloud-Native DevOps Platform
          </p>
        </div>

        <div className="mt-10 space-y-3 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            KokoaBank 시작하기
          </h2>

          <p className="text-sm leading-6 text-slate-500">
            카카오 계정으로 로그인하여
            <br />
            금융 시뮬레이션과 개발자 플랫폼을 이용할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loginWithKakao}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-5 py-4 font-semibold text-[#191919] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>카카오로 로그인</span>
          <ArrowRight size={18} />
        </button>

        <div className="mt-8 flex items-start gap-2 rounded-xl bg-slate-50 p-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <p className="text-xs leading-5 text-slate-500">
            별도의 비밀번호를 저장하지 않습니다.
            개발자 포털 접근 권한은 로그인 후 별도로 확인합니다.
          </p>
        </div>

        {isError && (
          <div
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            인증 서버에 연결할 수 없습니다.

            <button
              type="button"
              onClick={() => void refetch()}
              className="ml-2 font-semibold underline"
            >
              다시 시도
            </button>
          </div>
        )}
      </motion.section>
    </main>
  );
}
