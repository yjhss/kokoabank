import { ChevronRight, MoreHorizontal } from 'lucide-react';

import {
  formatAccountNumber,
  formatCurrency,
} from '../../utils/format';

import Button from './Button';

interface AccountCardProps {
  name: string;
  accountNumber: string;
  balance: number;
  color?: 'yellow' | 'white' | 'gray';
  onTransfer?: () => void;
  onDetail?: () => void;
}

export default function AccountCard({
  name,
  accountNumber,
  balance,
  color = 'yellow',
  onTransfer,
  onDetail,
}: AccountCardProps) {

  const backgrounds = {
    yellow: 'bg-bank-yellow',
    white: 'bg-white',
    gray: 'bg-[#E8EBF0]',
  };

  return (
    <section
      className={`
        rounded-2xl p-5
        ${backgrounds[color]}
      `}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onDetail}
          disabled={!onDetail}
          className="flex items-center gap-1 font-semibold"
        >
          {name}
          <ChevronRight size={16} />
        </button>

        <MoreHorizontal
          size={22}
          className="text-black/40"
          aria-hidden="true"
        />
      </div>

      <p className="mt-1 text-xs text-black/50">
        {formatAccountNumber(accountNumber)}
      </p>

      <div className="py-7 text-center">
        <span className="text-[30px] font-bold tracking-tight">
          {formatCurrency(balance)}
        </span>

        <span className="ml-1 text-lg font-medium">
          원
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDetail}
          disabled={!onDetail}
          className="border-none bg-white/50 hover:bg-white/80"
        >
          거래내역
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onTransfer}
          disabled={!onTransfer}
          className="border-none bg-white/50 hover:bg-white/80"
        >
          이체
        </Button>
      </div>
    </section>
  );
}
