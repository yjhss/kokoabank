import type { CatalogService, ServiceInput } from './types';

const BASE_URL = '/api/platform/services';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const catalogApi = {
  list: () => request<CatalogService[]>(''),

  get: (id: number) =>
    request<CatalogService>(`/${id}`),

  create: (data: ServiceInput) =>
    request<CatalogService>('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: ServiceInput) =>
    request<CatalogService>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<void>(`/${id}`, { method: 'DELETE' }),
};
