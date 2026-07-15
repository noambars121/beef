import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export function Textarea({
  label,
  error,
  hint,
  showCount,
  maxLength,
  id,
  className = "",
  value,
  ...props
}: TextareaProps) {
  const inputId = id ?? props.name;
  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={inputId} className="arcade-label mb-0">
          {label}
        </label>
        {showCount && maxLength && (
          <span className="font-mono text-[10px] text-court-muted">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        className={[
          "arcade-input resize-y text-base sm:text-sm",
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
