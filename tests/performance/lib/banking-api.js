import http from 'k6/http';

export const BASE_URL =
  __ENV.BASE_URL || 'http://localhost:8080';

export function sessionHeaders(extra = {}) {
  const cookie = __ENV.SESSION_COOKIE;

  if (!cookie || !cookie.startsWith('JSESSIONID=')) {
    throw new Error(
      'SESSION_COOKIE 환경변수에 로그인 세션을 설정해 주세요.'
    );
  }

  return {
    Cookie: cookie,
    ...extra,
  };
}

export function requireResponse(response, allowedStatuses) {
  if (!allowedStatuses.includes(response.status)) {
    throw new Error(
      `HTTP request failed: status=${response.status}, url=${response.url.split('?')[0]}`
    );
  }

  return response;
}

export function getCsrf() {
  const response = requireResponse(
    http.get(`${BASE_URL}/api/auth/csrf`, {
      headers: sessionHeaders(),
      timeout: '15s',
    }),
    [200]
  );

  const body = response.json();

  if (!body.headerName || !body.token) {
    throw new Error('CSRF 토큰 응답이 올바르지 않습니다.');
  }

  return {
    headerName: body.headerName,
    token: body.token,
  };
}

export function postJson(path, body, csrf, extraHeaders = {}) {
  return http.post(
    `${BASE_URL}${path}`,
    JSON.stringify(body),
    {
      headers: sessionHeaders({
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
        ...extraHeaders,
      }),
      timeout: '30s',
    }
  );
}

export function currentUser() {
  const response = requireResponse(
    http.get(`${BASE_URL}/api/auth/me`, {
      headers: sessionHeaders(),
      timeout: '15s',
    }),
    [200]
  );

  return response.json();
}

export function getAccount(accountId) {
  const response = requireResponse(
    http.get(
      `${BASE_URL}/api/banking/accounts/${accountId}`,
      {
        headers: sessionHeaders(),
        timeout: '30s',
      }
    ),
    [200]
  );

  return response.json();
}

export function getTransactions(accountId) {
  const response = requireResponse(
    http.get(
      `${BASE_URL}/api/banking/transactions?accountId=${accountId}`,
      {
        headers: sessionHeaders(),
        timeout: '30s',
      }
    ),
    [200]
  );

  return response.json();
}

export function prepareFixtures(initialFunds = 200000) {
  const user = currentUser();

  if (!['ADMIN', 'OPERATOR'].includes(user.role)) {
    throw new Error(
      '테스트 계정에는 ADMIN 또는 OPERATOR 권한이 필요합니다.'
    );
  }

  if (
    !Number.isSafeInteger(initialFunds) ||
    initialFunds <= 0 ||
    initialFunds > 1000000 ||
    initialFunds % 100000 !== 0
  ) {
    throw new Error('초기 자금 설정이 올바르지 않습니다.');
  }

  const csrf = getCsrf();

  const senderResponse = requireResponse(
    postJson(
      '/api/banking/accounts',
      { name: 'Part6D Load Sender' },
      csrf
    ),
    [201]
  );

  const receiverResponse = requireResponse(
    postJson(
      '/api/banking/accounts',
      { name: 'Part6D Load Receiver' },
      csrf
    ),
    [201]
  );

  const sender = senderResponse.json();
  const receiver = receiverResponse.json();

  for (let funded = 0; funded < initialFunds; funded += 100000) {
    requireResponse(
      postJson(
        '/api/banking/dev/fund',
        {
          accountId: sender.id,
          amount: 100000,
        },
        csrf
      ),
      [200]
    );
  }

  return {
    senderId: sender.id,
    receiverId: receiver.id,
    initialFunds,
    csrf,
    runId: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
  };
}

export function requestTransfer(
  data,
  amount,
  idempotencyKey
) {
  return postJson(
    '/api/banking/transfers',
    {
      fromAccountId: data.senderId,
      toAccountId: data.receiverId,
      amount,
      memo: 'Part 6D reliability experiment',
    },
    data.csrf,
    {
      'Idempotency-Key': idempotencyKey,
    }
  );
}
