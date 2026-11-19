import { Outlet } from 'react-router-dom';

import Header from './Header';
import BottomNavigation from './BottomNavigation';

export default function AppLayout() {
  return (
    <div
      className="
        mx-auto flex min-h-dvh w-full max-w-[480px]
        flex-col bg-bank-background
        sm:shadow-xl
      "
    >
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}
