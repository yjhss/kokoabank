import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
}

export default function PageHeader({
  title,
  description,
  backTo,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-7">
      {backTo && (
        <button
          type="button"
          aria-label="이전 화면"
          onClick={() => navigate(backTo)}
          className="mb-4 rounded-lg p-1"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <h2 className="text-[26px] font-bold tracking-tight">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm text-bank-gray">
          {description}
        </p>
      )}
    </div>
  );
}
