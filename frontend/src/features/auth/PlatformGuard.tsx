import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';

import {
  canAccessPlatform,
  getCurrentUser,
} from './api';

export default function PlatformGuard() {
  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  if (isPending) {
    return (
      <div className="p-8 text-sm text-slate-500">
        플랫폼 접근 권한을 확인하고 있습니다.
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPlatform(user.role)) {
    return (
      <Navigate
        to="/access-denied"
        replace
      />
    );
  }

  return <Outlet />;
}
