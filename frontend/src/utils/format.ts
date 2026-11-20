export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

export function formatWon(amount: number): string {
  return `${formatCurrency(amount)}원`;
}

export function formatAccountNumber(
  accountNumber: string,
): string {
  const value = accountNumber.replace(/\D/g, '');

  if (value.length === 13) {
    return value.replace(
      /(\d{4})(\d{2})(\d{7})/,
      '$1-$2-$3',
    );
  }

  return accountNumber;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}
