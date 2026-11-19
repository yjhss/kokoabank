import {
  House,
  ArrowLeftRight,
  History,
  Menu,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const navigationItems = [
  {
    label: '홈',
    path: '/home',
    icon: House,
  },
  {
    label: '이체',
    path: '/transfer',
    icon: ArrowLeftRight,
  },
  {
    label: '거래내역',
    path: '/transactions',
    icon: History,
  },
  {
    label: '전체',
    path: '/menu',
    icon: Menu,
  },
];

export default function BottomNavigation() {
  return (
    <nav
      aria-label="하단 메뉴"
      className="
        sticky bottom-0 z-20
        grid grid-cols-4
        border-t border-bank-border
        bg-white px-3 pt-3
        pb-[max(12px,env(safe-area-inset-bottom))]
      "
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1
              text-[11px] transition-colors
              ${
                isActive
                  ? 'font-semibold text-bank-black'
                  : 'text-bank-gray'
              }
            `}
          >
            <Icon size={23} strokeWidth={1.8} />

            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
