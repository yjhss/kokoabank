import { useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';

import { register } from '../features/auth/authApi';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] =
    useState('');

  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      register({
        name,
        username,
        password,
      });

      navigate('/home', { replace: true });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '회원가입에 실패했습니다.',
      );
    }
  };

  return (
    <main
      className="
        mx-auto min-h-dvh w-full max-w-[480px]
        bg-white px-6 py-10
      "
    >
      <PageHeader
        title="회원가입"
        description="코코아뱅크를 시작해 보세요."
        backTo="/login"
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="이름"
          placeholder="가상 이름 입력"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={30}
        />

        <Input
          label="아이디"
          placeholder="4자 이상 입력"
          value={username}
          onChange={(event) =>
            setUsername(event.target.value)
          }
          minLength={4}
          maxLength={30}
          autoComplete="username"
          required
        />

        <Input
          label="비밀번호"
          type="password"
          placeholder="8자 이상 입력"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          minLength={8}
          autoComplete="new-password"
          required
        />

        <Input
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호 다시 입력"
          value={passwordConfirm}
          onChange={(event) =>
            setPasswordConfirm(event.target.value)
          }
          autoComplete="new-password"
          required
        />

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth>
          가입하기
        </Button>

        <p className="text-center text-xs text-bank-gray">
          데모 회원가입입니다. 계정과 비밀번호는
          저장되지 않습니다.
        </p>
      </form>
    </main>
  );
}
