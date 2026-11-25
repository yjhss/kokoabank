import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

import {
  getAccount,
  getTransactions,
  prepareFixtures,
  requestTransfer,
} from './lib/banking-api.js';

const REQUEST_COUNT = 100;
const TRANSFER_AMOUNT = 1000;

const transferSuccess = new Rate('banking_transfer_success');

const transferDuration = new Trend(
  'banking_transfer_duration_ms',
  true
);

const completedTransfers = new Counter(
  'banking_completed_transfers'
);

export const options = {
  scenarios: {
    transfer_load: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: REQUEST_COUNT,
      maxDuration: '3m',
    },
  },

  thresholds: {
    banking_transfer_success: ['rate==1'],
    banking_transfer_duration_ms: ['p(95)<3000'],
    banking_completed_transfers: ['count==100'],
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return prepareFixtures(200000);
}

export default function (data) {
  const key = [
    'part6d',
    data.runId,
    exec.scenario.iterationInTest,
  ].join('-');

  const response = requestTransfer(
    data,
    TRANSFER_AMOUNT,
    key
  );

  transferDuration.add(response.timings.duration);

  let body = null;

  if (response.status === 200) {
    body = response.json();
  }

  const success =
    response.status === 200 &&
    body !== null &&
    body.status === 'COMPLETED' &&
    body.replayed === false;

  transferSuccess.add(success);

  check(response, {
    '이체 요청 성공': () => success,
  });

  if (success) {
    completedTransfers.add(1);
  }
}

export function teardown(data) {
  const sender = getAccount(data.senderId);
  const receiver = getAccount(data.receiverId);

  const senderTransactions = getTransactions(data.senderId);
  const receiverTransactions = getTransactions(data.receiverId);

  const expectedSender =
    data.initialFunds - REQUEST_COUNT * TRANSFER_AMOUNT;

  const expectedReceiver =
    REQUEST_COUNT * TRANSFER_AMOUNT;

  const valid =
    sender.balance === expectedSender &&
    receiver.balance === expectedReceiver &&
    sender.balance + receiver.balance === data.initialFunds &&
    senderTransactions.length === REQUEST_COUNT &&
    receiverTransactions.length === REQUEST_COUNT;

  console.log(
    JSON.stringify({
      experiment: 'transfer-load',
      requests: REQUEST_COUNT,
      senderId: data.senderId,
      receiverId: data.receiverId,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance,
      totalBalance: sender.balance + receiver.balance,
      senderLedgerCount: senderTransactions.length,
      receiverLedgerCount: receiverTransactions.length,
      consistency: valid ? 'PASS' : 'FAIL',
    })
  );

  if (!valid) {
    throw new Error('BANKING CONSISTENCY CHECK FAILED');
  }
}
