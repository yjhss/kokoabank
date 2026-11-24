export type PlatformRole =
  | 'USER'
  | 'DEVELOPER'
  | 'OPERATOR'
  | 'ADMIN';

export interface CurrentUser {
  authenticated: boolean;
  username: string;
  role: PlatformRole;
}

export interface CsrfResponse {
  headerName: string;
  token: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `사용자 정보 조회 실패: ${response.status}`
    );
  }

  return (await response.json()) as CurrentUser;
}

export async function getCsrfToken(): Promise<CsrfResponse> {
  const response = await fetch('/api/auth/csrf', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `CSRF 토큰 발급 실패: ${response.status}`
    );
  }

  return (await response.json()) as CsrfResponse;
}

export async function authorizedMutation(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<Response> {
  const csrf = await getCsrfToken();

  const headers: Record<string, string> = {
    [csrf.headerName]: csrf.token,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined
      ? undefined
      : JSON.stringify(body),
  });
}

export function loginWithKakao(): void {
  window.location.assign(
    '/oauth2/authorization/kakao'
  );
}

export async function logout(): Promise<void> {
  const response = await authorizedMutation(
    '/api/auth/logout',
    'POST'
  );

  if (!response.ok) {
    throw new Error(
      `로그아웃 실패: ${response.status}`
    );
  }

  window.location.assign('/login');
}

export function canAccessPlatform(
  role: PlatformRole
): boolean {
  return [
    'DEVELOPER',
    'OPERATOR',
    'ADMIN',
  ].includes(role);
}
