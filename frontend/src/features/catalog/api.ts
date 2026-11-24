import { authorizedMutation } from '../auth/api';

import type {
  CatalogService,
  ServiceInput,
} from './types';

const BASE_URL = '/api/platform/services';

async function readRequest<T>(
  path: string
): Promise<T> {
  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Service Catalog 조회 실패: ${response.status}`
    );
  }

  return (await response.json()) as T;
}

async function writeRequest<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: ServiceInput
): Promise<T> {
  const response = await authorizedMutation(
    `${BASE_URL}${path}`,
    method,
    body
  );

  if (!response.ok) {
    let message = `요청 실패: ${response.status}`;

    if (response.status === 401) {
      message = '로그인이 필요합니다.';
    }

    if (response.status === 403) {
      message = '요청을 수행할 권한이 없습니다.';
    }

    if (response.status === 409) {
      message = '이미 등록된 서비스 식별자입니다.';
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const catalogApi = {
  list(): Promise<CatalogService[]> {
    return readRequest<CatalogService[]>('');
  },

  get(id: number): Promise<CatalogService> {
    return readRequest<CatalogService>(`/${id}`);
  },

  create(data: ServiceInput): Promise<CatalogService> {
    return writeRequest<CatalogService>(
      '',
      'POST',
      data
    );
  },

  update(
    id: number,
    data: ServiceInput
  ): Promise<CatalogService> {
    return writeRequest<CatalogService>(
      `/${id}`,
      'PUT',
      data
    );
  },

  remove(id: number): Promise<void> {
    return writeRequest<void>(
      `/${id}`,
      'DELETE'
    );
  },
};
