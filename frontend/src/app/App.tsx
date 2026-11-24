import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import PlatformLayout from '../components/layout/PlatformLayout';
import LoginPage from '../features/auth/LoginPage';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import PlatformGuard from '../features/auth/PlatformGuard';

import OverviewPage from '../pages/OverviewPage';
import BankingHomePage from '../pages/BankingHomePage';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import ServiceCatalogPage from '../features/catalog/ServiceCatalogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/banking"
              element={<BankingHomePage />}
            />

            <Route
              path="/access-denied"
              element={<AccessDeniedPage />}
            />

            <Route element={<PlatformGuard />}>
              <Route element={<PlatformLayout />}>
                <Route
                  path="/"
                  element={<OverviewPage />}
                />

                <Route
                  path="/services"
                  element={<ServiceCatalogPage />}
                />
              </Route>
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
