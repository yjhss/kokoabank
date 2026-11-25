import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Gift,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';

import {
  rewardApi,
  type CardPaymentRequest,
} from './api';

const formatWon = (value: number) =>
  `${value.toLocaleString('ko-KR')}원`;

export default function RewardPage() {
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const [accountId, setAccountId] = useState('');
  const [merchantName, setMerchantName] = useState('Kokoa Demo Store');
  const [amount, setAmount] = useState('10000');
  const [paymentError, setPaymentError] = useState('');

  const [pendingPayment, setPendingPayment] = useState<{
    request: CardPaymentRequest;
    key: string;
  } | null>(null);

  const [lastResult, setLastResult] = useState<{
    amount: number;
    cashback: number;
    rate: number;
    balance: number;
    replayed: boolean;
  } | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['banking', 'accounts'],
    queryFn: rewardApi.accounts,
  });

  const drawQuery = useQuery({
    queryKey: ['rewards', 'active-draw'],
    queryFn: rewardApi.activeDraw,
  });

  const paymentsQuery = useQuery({
    queryKey: ['rewards', 'payments'],
    queryFn: rewardApi.payments,
  });

  const drawMutation = useMutation({
    mutationFn: rewardApi.draw,
    onSuccess: async () => {
      setLastResult(null);
      await queryClient.invalidateQueries({
        queryKey: ['rewards', 'active-draw'],
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (value: {
      request: CardPaymentRequest;
      key: string;
    }) => rewardApi.pay(value.request, value.key),

    onSuccess: async (payment) => {
      setPaymentError('');
      setPendingPayment(null);

      setLastResult({
        amount: payment.amount,
        cashback: payment.cashbackAmount,
        rate: payment.cashbackRate,
        balance: payment.balanceAfter,
        replayed: payment.replayed,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['banking', 'accounts'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['rewards', 'active-draw'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['rewards', 'payments'],
        }),
      ]);
    },

    onError: (error) => {
      setPaymentError(
        error instanceof Error
          ? error.message
          : '결제 요청에 실패했습니다.'
      );
    },
  });

  const activeDraw = drawQuery.data ?? null;
  const accounts = accountsQuery.data ?? [];

  const selectedAccount = useMemo(
    () => accounts.find((account) =>
      String(account.id) === accountId
    ),
    [accounts, accountId]
  );

  function handlePayment() {
    setPaymentError('');

    if (!activeDraw) {
      setPaymentError('먼저 캐시백을 뽑아 주세요.');
      return;
    }

    const parsedAmount = Number(amount);
    const parsedAccountId = Number(accountId);

    if (
      !Number.isSafeInteger(parsedAmount)
      || parsedAmount < 1000
      || parsedAmount > 100000
    ) {
      setPaymentError('결제 금액은 1,000~100,000원입니다.');
      return;
    }

    if (!selectedAccount || !Number.isSafeInteger(parsedAccountId)) {
      setPaymentError('결제 계좌를 선택해 주세요.');
      return;
    }

    if (!merchantName.trim()) {
      setPaymentError('가상 가맹점 이름을 입력해 주세요.');
      return;
    }

    if (selectedAccount.balance < parsedAmount) {
      setPaymentError('계좌 잔액이 부족합니다.');
      return;
    }

    const request: CardPaymentRequest = {
      accountId: parsedAccountId,
      rewardDrawId: activeDraw.id,
      merchantName: merchantName.trim(),
      amount: parsedAmount,
    };

    const payment = {
      request,
      key: crypto.randomUUID(),
    };

    setPendingPayment(payment);
    paymentMutation.mutate(payment);
  }

  const hasPendingPayment = pendingPayment !== null;

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/banking"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Banking Service
        </Link>

        <div className="mt-7">
          <p className="text-sm font-medium text-slate-500">
            Banking Simulation / Rewards
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            랜덤 캐시백
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            캐시백을 추첨하고 가상 카드 결제에 적용해 보세요.
          </p>
        </div>

        <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          실제 카드 결제나 현금 지급은 발생하지 않습니다.
          모든 거래는 KokoaBank 테스트용 데이터입니다.
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-2">
              <Gift size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold">캐시백 추첨</h2>
            </div>

            <div className="flex min-h-64 flex-col items-center justify-center">
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        rotate: drawMutation.isPending ? 360 : 0,
                        scale: drawMutation.isPending ? [1, 1.1, 1] : 1,
                      }
                }
                transition={
                  drawMutation.isPending
                    ? { repeat: Infinity, duration: 1.4 }
                    : { duration: 0.3 }
                }
                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#FFF3B2]"
              >
                <Gift size={44} className="text-amber-600" />
              </motion.div>

              <AnimatePresence mode="wait">
                {activeDraw ? (
                  <motion.div
                    key={`reward-${activeDraw.id}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-sm text-slate-500">
                      사용 가능한 캐시백
                    </p>
                    <p className="mt-2 text-5xl font-black text-amber-600">
                      {activeDraw.cashbackRate}%
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      결제 시 최대 1,000원 적립
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-reward"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-lg font-bold">
                      어떤 캐시백이 나올까요?
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      1% · 2% · 3% · 5%
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              disabled={
                drawMutation.isPending
                || drawQuery.isPending
                || Boolean(activeDraw)
                || hasPendingPayment
              }
              onClick={() => drawMutation.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-5 py-4 font-bold text-[#191919] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {drawMutation.isPending ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {activeDraw ? '이미 추첨한 캐시백이 있습니다' : '캐시백 뽑기'}
            </button>

            {drawMutation.isError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                추첨에 실패했습니다. 다시 시도해 주세요.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard size={20} />
              <h2 className="text-lg font-bold">가상 카드 결제</h2>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  결제 계좌
                </span>

                <select
                  value={accountId}
                  disabled={hasPendingPayment}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="">계좌 선택</option>
                  {accounts
                    .filter((account) => account.status === 'ACTIVE')
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} · {formatWon(account.balance)}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  가상 가맹점
                </span>
                <input
                  value={merchantName}
                  disabled={hasPendingPayment}
                  maxLength={100}
                  onChange={(event) => setMerchantName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  결제 금액 (원)
                </span>
                <input
                  type="number"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={amount}
                  disabled={hasPendingPayment}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </label>

              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">적용 캐시백</span>
                  <strong>{activeDraw?.cashbackRate ?? 0}%</strong>
                </div>
                <div className="mt-3 flex justify-between">
                  <span className="text-slate-500">예상 적립액</span>
                  <strong>
                    {activeDraw && Number(amount) >= 1000
                      ? formatWon(
                          Math.min(
                            Math.floor(
                              Number(amount) * activeDraw.cashbackRate / 100
                            ),
                            1000
                          )
                        )
                      : '0원'}
                  </strong>
                </div>
              </div>

              {paymentError && (
                <p role="alert" className="text-sm text-red-600">
                  {paymentError}
                </p>
              )}

              {hasPendingPayment && !paymentMutation.isPending && (
                <button
                  type="button"
                  onClick={() => {
                    if (pendingPayment) {
                      paymentMutation.mutate(pendingPayment);
                    }
                  }}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-semibold"
                >
                  동일 요청으로 재시도
                </button>
              )}

              <button
                type="button"
                disabled={!activeDraw || hasPendingPayment || paymentMutation.isPending}
                onClick={handlePayment}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentMutation.isPending && (
                  <LoaderCircle size={18} className="animate-spin" />
                )}
                가상 결제 및 캐시백 받기
              </button>

              {hasPendingPayment && (
                <p className="text-xs leading-5 text-slate-500">
                  결제 처리 여부를 확인하지 못한 요청은 동일한 멱등성 키로
                  다시 시도해야 합니다. 계좌 잔액과 결제 내역도 확인해 주세요.
                </p>
              )}
            </div>
          </section>
        </div>

        {lastResult && (
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6"
          >
            <div className="flex items-center gap-2 font-bold text-green-900">
              <CheckCircle2 size={22} />
              가상 결제가 완료되었습니다.
            </div>

            <p className="mt-3 text-sm text-green-900">
              {formatWon(lastResult.amount)} 결제 · {lastResult.rate}%
              캐시백 {formatWon(lastResult.cashback)} 적립
            </p>

            <p className="mt-2 text-sm text-green-800">
              결제 후 계좌 잔액: {formatWon(lastResult.balance)}
            </p>

            {lastResult.replayed && (
              <p className="mt-2 text-xs text-green-700">
                기존 결제 결과를 재조회했습니다. 중복 결제되지 않았습니다.
              </p>
            )}
          </motion.section>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7">
          <h2 className="text-lg font-bold">최근 가상 결제</h2>

          {paymentsQuery.isPending ? (
            <p className="mt-5 text-sm text-slate-500">조회 중...</p>
          ) : paymentsQuery.isError ? (
            <p className="mt-5 text-sm text-red-600">
              결제 내역을 불러오지 못했습니다.
            </p>
          ) : paymentsQuery.data?.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              아직 가상 결제 내역이 없습니다.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {paymentsQuery.data?.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-semibold">{payment.merchantName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      캐시백 {payment.cashbackRate}%
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      −{formatWon(payment.amount)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-green-600">
                      +{formatWon(payment.cashbackAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
