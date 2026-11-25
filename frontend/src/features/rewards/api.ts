import { authorizedMutation } from '../auth/api';

export interface RewardDraw {
  id: number;
  cashbackRate: number;
  status: 'AVAILABLE' | 'USED';
  createdAt: string;
}

export interface BankingAccount {
  id: number;
  accountNumber: string;
  name: string;
  balance: number;
  status: string;
}

export interface CardPaymentRequest {
  accountId: number;
  rewardDrawId: number;
  merchantName: string;
  amount: number;
}

export interface CardPayment {
  id: number;
  accountId: number;
  rewardDrawId: number;
  merchantName: string;
  amount: number;
  cashbackRate: number;
  cashbackAmount: number;
  balanceAfter: number;
  status: string;
  replayed: boolean;
}

async function parseResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    let message = `요청 실패: ${response.status}`;

    if (response.status === 401) {
      message = '로그인이 필요합니다.';
    } else if (response.status === 403) {
      message = '요청 권한이 없거나 CSRF 검증에 실패했습니다.';
    } else if (response.status === 409) {
      message = '잔액 부족, 사용된 캐시백 또는 중복 요청을 확인해 주세요.';
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const rewardApi = {
  async activeDraw(): Promise<RewardDraw | null> {
    const response = await fetch('/api/rewards/draws/active', {
      credentials: 'include',
    });

    if (response.status === 204) {
      return null;
    }

    return parseResponse<RewardDraw>(response);
  },

  async draw(): Promise<RewardDraw> {
    const response = await authorizedMutation(
      '/api/rewards/draws',
      'POST'
    );

    return parseResponse<RewardDraw>(response);
  },

  async accounts(): Promise<BankingAccount[]> {
    const response = await fetch('/api/banking/accounts', {
      credentials: 'include',
    });

    return parseResponse<BankingAccount[]>(response);
  },

  async pay(
    request: CardPaymentRequest,
    idempotencyKey: string
  ): Promise<CardPayment> {
    // Obtain a fresh CSRF token and preserve the idempotency key.
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include',
    });

    if (!csrfResponse.ok) {
      throw new Error('CSRF 토큰을 조회하지 못했습니다.');
    }

    const csrf = await csrfResponse.json() as {
      headerName: string;
      token: string;
    };

    const response = await fetch('/api/rewards/payments', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(request),
    });

    return parseResponse<CardPayment>(response);
  },

  async payments(): Promise<CardPayment[]> {
    const response = await fetch('/api/rewards/payments', {
      credentials: 'include',
    });

    return parseResponse<CardPayment[]>(response);
  },
};
