import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import PlatformLayout from '../components/layout/PlatformLayout';
import OverviewPage from '../pages/OverviewPage';
import ServiceCatalogPage from '../features/catalog/ServiceCatalogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PlatformLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="/services" element={<ServiceCatalogPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
