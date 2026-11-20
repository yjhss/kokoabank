import {
  createBrowserRouter,
  Navigate,
} from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

import HomePage from '../pages/HomePage';
import AccountsPage from '../pages/AccountsPage';
import AccountDetailPage from '../pages/AccountDetailPage';
import TransferPage from '../pages/TransferPage';
import TransactionsPage from '../pages/TransactionsPage';
import MenuPage from '../pages/MenuPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },

  {
    path: '/login',
    element: <LoginPage />,
  },

  {
    path: '/register',
    element: <RegisterPage />,
  },

  {
    element: <ProtectedRoute />,

    children: [
      {
        element: <AppLayout />,

        children: [
          {
            path: '/home',
            element: <HomePage />,
          },
          {
            path: '/accounts',
            element: <AccountsPage />,
          },
          {
            path: '/accounts/:accountId',
            element: <AccountDetailPage />,
          },
          {
            path: '/transfer',
            element: <TransferPage />,
          },
          {
            path: '/transactions',
            element: <TransactionsPage />,
          },
          {
            path: '/menu',
            element: <MenuPage />,
          },
        ],
      },
    ],
  },

  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);
