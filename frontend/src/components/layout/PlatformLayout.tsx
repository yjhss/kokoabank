import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Boxes,
  GitBranch,
  LayoutDashboard,
  Rocket,
  Settings2,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

const menu = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/services', label: 'Service Catalog', icon: Boxes },
];

const upcoming = [
  { label: 'Pipelines', icon: GitBranch },
  { label: 'Deployments', icon: Rocket },
  { label: 'Observability', icon: Activity },
  { label: 'Incidents', icon: ShieldAlert },
  { label: 'Developer CLI', icon: Terminal },
  { label: 'Settings', icon: Settings2 },
];

export default function PlatformLayout() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 md:flex">
      <aside className="border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEE500] text-lg font-black">
            K
          </div>
          <div>
            <p className="text-lg font-bold">KokoaBank</p>
            <p className="text-xs text-slate-500">
              DevOps Platform
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>

        <nav className="flex flex-wrap gap-1 md:flex-col">
          {menu.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
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
        </nav>

        <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Coming Soon
        </p>

        <div className="space-y-1">
          {upcoming.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"
              aria-disabled="true"
            >
              <Icon size={18} />
              {label}
            </div>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <span className="text-sm font-semibold">Platform Console</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            LOCAL DEV
          </span>
        </header>

        <div className="mx-auto max-w-7xl p-5 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
