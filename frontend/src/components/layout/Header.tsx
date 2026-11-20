import { Bell, LogOut } from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { logout } from '../../features/auth/authApi';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className="
        sticky top-0 z-20 flex h-16 shrink-0
        items-center justify-between
        bg-bank-background px-5
      "
    >
      <Link to="/home">
        <h1 className="text-[23px] font-extrabold tracking-tight">
          kokoabank
          <span className="text-[#C6AD00]">.</span>
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        <Bell
          size={23}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <button
          type="button"
          aria-label="로그아웃"
          onClick={handleLogout}
          className="rounded-lg p-1"
        >
          <LogOut size={22} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
