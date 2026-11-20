import { useState } from 'react';
import type { FormEvent } from 'react';

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AccountCard from '../components/ui/AccountCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';

import {
  useAccounts,
  createAccount,
} from '../features/account/accountApi';

export default function AccountsPage() {
  const navigate = useNavigate();
  const accounts = useAccounts();

  const [showCreate, setShowCreate] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      createAccount(accountName);
      setAccountName('');
      setShowCreate(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '계좌 개설에 실패했습니다.',
      );
    }
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <PageHeader
        title="내 계좌"
        description={`총 ${accounts.length}개의 계좌`}
      />

      <section className="space-y-4">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            name={account.name}
            accountNumber={account.accountNumber}
            balance={account.balance}
            color={account.color}
            onDetail={() =>
              navigate(`/accounts/${account.id}`)
            }
            onTransfer={() =>
              navigate(
                `/transfer?accountId=${account.id}`,
              )
            }
          />
        ))}
      </section>

      {!showCreate && (
        <Button
          variant="outline"
          fullWidth
          onClick={() => {
            setShowCreate(true);
            setError('');
          }}
          className="mt-5 gap-2"
        >
          <Plus size={18} />
          새 계좌 개설
        </Button>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-5 space-y-4 rounded-2xl bg-white p-5"
        >
          <h3 className="font-bold">
            새 입출금통장
          </h3>

          <Input
            label="계좌 이름"
            placeholder="예: 생활비 통장"
            value={accountName}
            onChange={(event) =>
              setAccountName(event.target.value)
            }
            maxLength={30}
            required
          />

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                setError('');
                setAccountName('');
              }}
            >
              취소
            </Button>

            <Button type="submit">
              개설하기
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
