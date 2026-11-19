import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

interface PendingPageProps {
  title: string;
}

export default function PendingPage({
  title,
}: PendingPageProps) {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-10">
      <h2 className="text-2xl font-bold">{title}</h2>

      <p className="mb-8 mt-3 text-sm text-bank-gray">
        다음 개발 단계에서 구현할 페이지입니다.
      </p>

      <Button onClick={() => navigate('/home')}>
        홈으로 돌아가기
      </Button>
    </section>
  );
}
