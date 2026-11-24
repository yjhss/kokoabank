import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';

import { getCurrentUser } from './api';

export default function ProtectedRoute() {
  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 0,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          로그인 상태를 확인하고 있습니다.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="mx-auto mt-16 max-w-lg rounded-xl bg-red-50 p-6 text-red-700"
      >
        인증 서버 연결에 실패했습니다.
        백엔드 실행 상태를 확인해 주세요.
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
