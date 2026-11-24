import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Activity,
  Boxes,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Rocket,
  Settings2,
  ShieldAlert,
  Terminal,
  X,
} from 'lucide-react';

import {
  getCurrentUser,
  logout,
} from '../../features/auth/api';

const enabledMenu = [
  {
    to: '/',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    to: '/services',
    label: 'Service Catalog',
    icon: Boxes,
  },
];

const upcomingMenu = [
  { label: 'Pipelines', icon: GitBranch },
  { label: 'Deployments', icon: Rocket },
  { label: 'Observability', icon: Activity },
  { label: 'Incidents', icon: ShieldAlert },
  { label: 'Developer CLI', icon: Terminal },
  { label: 'Settings', icon: Settings2 },
];

export default function PlatformLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
  });

  async function handleLogout() {
    try {
      setLogoutError('');
      await logout();
    } catch {
      setLogoutError('로그아웃에 실패했습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 md:flex">
      <aside
        className={`border-r border-slate-200 bg-white p-5 md:min-h-screen md:w-64 ${
          mobileMenuOpen ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEE500] text-lg font-black">
              K
            </div>

            <div>
              <p className="text-lg font-bold">KokoaBank</p>
              <p className="text-xs text-slate-500">
                DevOps Platform
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {enabledMenu.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#FFF6C2] font-semibold text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          <Link
            to="/banking"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Landmark size={18} />
            Banking Service
          </Link>
        </nav>

        <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Coming Soon
        </p>

        <div className="space-y-1">
          {upcomingMenu.map(({ label, icon: Icon }) => (
            <div
              key={label}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"
            >
              <Icon size={18} />
              {label}
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu size={22} />
            </button>

            <span className="text-sm font-semibold">
              Platform Console
            </span>

            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 sm:inline-block">
              LOCAL DEV
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium sm:inline-block">
                {user.role}
              </span>
            )}

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:bg-slate-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">
                로그아웃
              </span>
            </button>
          </div>
        </header>

        {logoutError && (
          <div
            role="alert"
            className="mx-5 mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 md:mx-8"
          >
            {logoutError}
          </div>
        )}

        <main className="mx-auto max-w-7xl p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
