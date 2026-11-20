import { useState } from 'react';
import type { FormEvent } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

import { login } from '../features/auth/authApi';

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      login({ username, password });
      navigate('/home', { replace: true });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '로그인에 실패했습니다.',
      );
    }
  };

  const handleDemoLogin = () => {
    login({
      username: 'demo',
      password: 'demo1234',
    });

    navigate('/home', { replace: true });
  };

  return (
    <main
      className="
        mx-auto flex min-h-dvh w-full max-w-[480px]
        flex-col justify-center
        bg-bank-yellow px-8 py-12
      "
    >
      <section className="mb-10 text-center">
        <div
          className="
            mx-auto mb-5 flex h-20 w-20
            items-center justify-center
            rounded-[24px] bg-bank-black
          "
        >
          <span className="text-5xl font-black text-bank-yellow">
            k
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">
          kokoabank
        </h1>

        <p className="mt-3 text-sm font-medium">
          일상 속 더 편리한 금융
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          aria-label="아이디"
          placeholder="아이디"
          autoComplete="username"
          value={username}
          onChange={(event) =>
            setUsername(event.target.value)
          }
          required
        />

        <Input
          aria-label="비밀번호"
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="dark"
          size="lg"
          fullWidth
        >
          로그인
        </Button>
      </form>

      <div className="mt-6 flex justify-center gap-5 text-sm">
        <Link to="/register">회원가입</Link>

        <button
          type="button"
          onClick={handleDemoLogin}
          className="font-semibold"
        >
          데모 로그인
        </button>
      </div>

      <div className="mt-10 rounded-xl bg-white/40 p-4 text-center">
        <p className="text-xs font-medium">
          데모 계정: demo / demo1234
        </p>

        <p className="mt-2 text-xs text-black/60">
          실제 금융기관과 관련 없는 학습용 서비스입니다.
          실제 개인정보를 입력하지 마세요.
        </p>
      </div>
    </main>
  );
}
