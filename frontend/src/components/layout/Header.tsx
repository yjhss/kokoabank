import { Bell, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      className="
        sticky top-0 z-20
        flex h-16 items-center justify-between
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
          aria-label="데모 종료"
          onClick={() => navigate('/login')}
          className="rounded-lg p-1"
        >
          <LogOut size={22} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
