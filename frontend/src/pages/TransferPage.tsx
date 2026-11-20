import { useState } from 'react';
import type { FormEvent } from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  Check,
  ArrowDown,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';

import { useAccounts } from '../features/account/accountApi';
import { createTransfer } from '../features/transfer/transferApi';

import {
  formatAccountNumber,
  formatWon,
  formatDateTime,
} from '../utils/format';

import type { TransferResult } from '../types/bank';

type Step = 'INPUT' | 'CONFIRM' | 'COMPLETE';

export default function TransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const accounts = useAccounts();

  const requestedAccountId =
    searchParams.get('accountId');

  const initialAccountId = accounts.some(
    (account) => account.id === requestedAccountId,
  )
    ? requestedAccountId!
    : accounts[0]?.id || '';

  const [step, setStep] = useState<Step>('INPUT');

  const [fromAccountId, setFromAccountId] =
    useState(initialAccountId);

  const [toAccountNumber, setToAccountNumber] =
    useState('');

  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const [result, setResult] =
    useState<TransferResult | null>(null);

  const fromAccount = accounts.find(
    (account) => account.id === fromAccountId,
  );

  const normalizedNumber =
    toAccountNumber.replace(/-/g, '').trim();

  const toAccount = accounts.find(
    (account) =>
      account.accountNumber === normalizedNumber,
  );

  const numericAmount = Number(amount);

  const validateTransfer = () => {
    if (!fromAccount) {
      throw new Error('출금 계좌를 선택해주세요.');
    }

    if (!toAccount) {
      throw new Error(
        '입금할 데모 계좌번호를 확인해주세요.',
      );
    }

    if (fromAccount.id === toAccount.id) {
      throw new Error(
        '동일한 계좌로 이체할 수 없습니다.',
      );
    }

    if (
      !/^\d+$/.test(amount) ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      throw new Error(
        '올바른 이체 금액을 입력해주세요.',
      );
    }

    if (numericAmount > fromAccount.balance) {
      throw new Error('잔액이 부족합니다.');
    }
  };

  const handleNext = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      validateTransfer();
      setStep('CONFIRM');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '입력 정보를 확인해주세요.',
      );
    }
  };

  const handleTransfer = () => {
    setError('');

    try {
      validateTransfer();

      const response = createTransfer({
        fromAccountId,
        toAccountNumber: normalizedNumber,
        amount: numericAmount,
        memo,
      });

      setResult(response);
      setStep('COMPLETE');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '이체에 실패했습니다.',
      );
    }
  };

  if (step === 'COMPLETE' && result) {
    return (
      <div className="px-5 pb-8 pt-12">
        <section className="text-center">
          <div
            className="
              mx-auto mb-6 flex h-20 w-20
              items-center justify-center
              rounded-full bg-bank-yellow
            "
          >
            <Check size={42} />
          </div>

          <h2 className="text-2xl font-bold">
            이체가 완료되었어요
          </h2>

          <p className="mt-5 text-4xl font-extrabold">
            {formatWon(result.amount)}
          </p>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl bg-white p-5">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-bank-gray">
              받는 계좌
            </span>
            <span className="text-sm font-medium">
              {result.toAccount.name}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-sm text-bank-gray">
              출금 후 잔액
            </span>
            <span className="text-sm font-semibold">
              {formatWon(result.fromAccount.balance)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-sm text-bank-gray">
              거래 시간
            </span>
            <span className="text-sm">
              {formatDateTime(result.completedAt)}
            </span>
          </div>
        </section>

        <div className="mt-7 space-y-3">
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate('/home')}
          >
            확인
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/transactions')}
          >
            거래내역 확인
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'CONFIRM') {
    return (
      <div className="px-5 pb-8 pt-5">
        <PageHeader
          title="이체 정보를 확인해주세요"
          description="받는 계좌와 금액을 다시 확인해주세요."
        />

        <section className="rounded-2xl bg-white p-6">
          <div>
            <p className="text-xs text-bank-gray">
              출금 계좌
            </p>

            <p className="mt-2 font-semibold">
              {fromAccount?.name}
            </p>

            <p className="mt-1 text-xs text-bank-gray">
              {formatAccountNumber(
                fromAccount?.accountNumber || '',
              )}
            </p>
          </div>

          <ArrowDown
            size={24}
            className="mx-auto my-5 text-bank-gray"
          />

          <div>
            <p className="text-xs text-bank-gray">
              받는 계좌
            </p>

            <p className="mt-2 font-semibold">
              {toAccount?.name}
            </p>

            <p className="mt-1 text-xs text-bank-gray">
              {formatAccountNumber(normalizedNumber)}
            </p>
          </div>

          <div className="mt-6 border-t border-bank-border pt-6">
            <p className="text-center text-sm text-bank-gray">
              보낼 금액
            </p>

            <p className="mt-2 text-center text-3xl font-bold">
              {formatWon(numericAmount)}
            </p>

            {memo.trim() && (
              <p className="mt-3 text-center text-sm">
                메모: {memo}
              </p>
            )}
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Button
            size="lg"
            fullWidth
            onClick={handleTransfer}
          >
            이체하기
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setError('');
              setStep('INPUT');
            }}
          >
            정보 수정
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-5">
      <PageHeader
        title="얼마를 보낼까요?"
        description="출금 계좌와 이체 정보를 입력해주세요."
      />

      <form onSubmit={handleNext} className="space-y-5">
        <section className="rounded-2xl bg-white p-5">
          <label
            htmlFor="from-account"
            className="mb-3 block text-sm font-medium"
          >
            출금 계좌
          </label>

          <select
            id="from-account"
            value={fromAccountId}
            onChange={(event) => {
              setFromAccountId(event.target.value);
              setError('');
            }}
            className="
              w-full rounded-xl border
              border-bank-border bg-white p-3
              text-sm outline-none
            "
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <p className="mt-3 text-xs text-bank-gray">
            출금 가능 금액
          </p>

          <p className="mt-1 text-xl font-bold">
            {formatWon(fromAccount?.balance || 0)}
          </p>
        </section>

        <Input
          label="받는 계좌번호"
          placeholder="계좌번호 입력"
          inputMode="numeric"
          value={toAccountNumber}
          onChange={(event) =>
            setToAccountNumber(event.target.value)
          }
          required
        />

        <section className="rounded-2xl bg-white p-4">
          <p className="mb-3 text-xs text-bank-gray">
            데모 이체 가능 계좌
          </p>

          <div className="space-y-3">
            {accounts
              .filter(
                (account) =>
                  account.id !== fromAccountId,
              )
              .map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() =>
                    setToAccountNumber(
                      account.accountNumber,
                    )
                  }
                  className="block w-full text-left"
                >
                  <p className="text-sm font-medium">
                    {account.name}
                  </p>

                  <p className="text-xs text-bank-gray">
                    {formatAccountNumber(
                      account.accountNumber,
                    )}
                  </p>
                </button>
              ))}
          </div>
        </section>

        <Input
          label="보낼 금액"
          placeholder="0원"
          inputMode="numeric"
          value={amount}
          onChange={(event) =>
            setAmount(
              event.target.value.replace(/\D/g, ''),
            )
          }
          required
        />

        <div className="grid grid-cols-4 gap-2">
          {[10000, 50000, 100000, 500000].map(
            (value) => (
              <Button
                key={value}
                size="sm"
                variant="outline"
                className="px-1"
                onClick={() => setAmount(String(value))}
              >
                {value / 10000}만
              </Button>
            ),
          )}
        </div>

        <Input
          label="메모 (선택)"
          placeholder="이체 메모"
          maxLength={30}
          value={memo}
          onChange={(event) =>
            setMemo(event.target.value)
          }
        />

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth>
          다음
        </Button>
      </form>
    </div>
  );
}
