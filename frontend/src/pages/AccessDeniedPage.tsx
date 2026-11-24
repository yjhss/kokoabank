import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <ShieldAlert size={30} className="text-red-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-950">
          접근 권한이 없습니다
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Developer Portal은 승인된 개발자와 운영자만 이용할 수 있습니다.
          <br />
          일반 사용자는 Banking Service를 이용해 주세요.
        </p>

        <Link
          to="/banking"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FEE500] px-5 py-3 text-sm font-semibold text-[#191919]"
        >
          <ArrowLeft size={17} />
          Banking Service로 이동
        </Link>
      </section>
    </main>
  );
}
