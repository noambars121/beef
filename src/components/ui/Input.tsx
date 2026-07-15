import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="arcade-label">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "arcade-input text-base sm:text-sm",
          error ? "border-arcade-pink focus:border-arcade-pink" : "",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="font-mono text-[10px] text-court-muted uppercase">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="font-mono text-[10px] text-arcade-pink uppercase" role="alert">
          [ERROR: {error}]
        </p>
      )}
    </div>
  );
}
