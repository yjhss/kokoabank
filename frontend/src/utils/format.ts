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
