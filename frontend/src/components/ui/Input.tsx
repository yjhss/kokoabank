import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : undefined
        }
        className={`
          w-full rounded-xl border bg-white
          px-4 py-4 text-base outline-none
          transition-colors
          placeholder:text-gray-400
          focus:border-bank-yellow-dark
          ${
            error
              ? 'border-red-500'
              : 'border-bank-border'
          }
          ${className}
        `}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-2 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}
