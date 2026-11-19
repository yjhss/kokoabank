import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <main
      className="
        mx-auto flex min-h-dvh w-full max-w-[480px]
        flex-col justify-between
        bg-bank-yellow px-8 py-12
      "
    >
      <div />

      <section className="text-center">
        <div
          className="
            mx-auto mb-6 flex h-24 w-24
            items-center justify-center
            rounded-[28px] bg-bank-black
          "
        >
          <span className="text-6xl font-black text-bank-yellow">
            k
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">
          kokoabank
        </h1>

        <p className="mt-4 text-lg font-medium">
          일상 속 더 편리한 금융
        </p>
      </section>

      <section>
        <Button
          variant="dark"
          size="lg"
          fullWidth
          onClick={() => navigate('/home')}
        >
          데모 시작하기
        </Button>

        <p className="mt-5 text-center text-xs text-black/50">
          실제 금융기관과 관련 없는 학습용 프로젝트입니다.
        </p>
      </section>
    </main>
  );
}
