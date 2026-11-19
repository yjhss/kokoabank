import {
  createBrowserRouter,
  Navigate,
} from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import PendingPage from '../pages/PendingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/home',
        element: <HomePage />,
      },
      {
        path: '/accounts',
        element: <PendingPage title="계좌 관리" />,
      },
      {
        path: '/accounts/:accountId',
        element: <PendingPage title="계좌 상세" />,
      },
      {
        path: '/transfer',
        element: <PendingPage title="이체" />,
      },
      {
        path: '/transactions',
        element: <PendingPage title="거래내역" />,
      },
      {
        path: '/menu',
        element: <PendingPage title="전체 메뉴" />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);
