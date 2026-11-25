import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

import {
  getAccount,
  getTransactions,
  prepareFixtures,
  requestTransfer,
} from './lib/banking-api.js';

const REQUEST_COUNT = 30;
const TRANSFER_AMOUNT = 10000;

const requestSuccess = new Rate('banking_idempotency_success');

const requestDuration = new Trend(
  'banking_idempotency_duration_ms',
  true
);

const duplicateResponses = new Counter(
  'banking_idempotency_replays'
);

export const options = {
  scenarios: {
    duplicate_transfer: {
      executor: 'shared-iterations',
      vus: 30,
      iterations: REQUEST_COUNT,
      maxDuration: '3m',
    },
  },

  thresholds: {
    banking_idempotency_success: ['rate==1'],
    banking_idempotency_duration_ms: ['p(95)<3000'],
    banking_idempotency_replays: ['count==29'],
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return prepareFixtures(100000);
}

export default function (data) {
  const sharedKey = `part6d-duplicate-${data.runId}`;

  const response = requestTransfer(
    data,
    TRANSFER_AMOUNT,
    sharedKey
  );

  requestDuration.add(response.timings.duration);

  const body = response.status === 200
    ? response.json()
    : null;

  const success =
    response.status === 200 &&
    body !== null &&
    body.status === 'COMPLETED' &&
    body.amount === TRANSFER_AMOUNT &&
    body.fromAccountId === data.senderId &&
    body.toAccountId === data.receiverId &&
    body.idempotencyKey === sharedKey;

  requestSuccess.add(success);

  check(response, {
    '멱등성 요청 정상 처리': () => success,
  });

  if (success && body.replayed === true) {
    duplicateResponses.add(1);
  }
}

export function teardown(data) {
  const sender = getAccount(data.senderId);
  const receiver = getAccount(data.receiverId);

  const senderTransactions = getTransactions(data.senderId);
  const receiverTransactions = getTransactions(data.receiverId);

  const expectedSender =
    data.initialFunds - TRANSFER_AMOUNT;

  const expectedReceiver = TRANSFER_AMOUNT;

  const valid =
    sender.balance === expectedSender &&
    receiver.balance === expectedReceiver &&
    senderTransactions.length === 1 &&
    receiverTransactions.length === 1;

  console.log(
    JSON.stringify({
      experiment: 'idempotency-race',
      totalRequests: REQUEST_COUNT,
      expectedActualTransfers: 1,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance,
      senderLedgerCount: senderTransactions.length,
      receiverLedgerCount: receiverTransactions.length,
      consistency: valid ? 'PASS' : 'FAIL',
    })
  );

  if (!valid) {
    throw new Error('IDEMPOTENCY CONSISTENCY CHECK FAILED');
  }
}
