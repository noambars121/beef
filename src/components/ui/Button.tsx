import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-arcade-pink text-white border-4 border-black border-b-8 border-r-8 active:border-b-4 active:border-r-4 hover:bg-white hover:text-black shadow-[0_0_15px_rgba(255,0,127,0.3)]",
  secondary:
    "bg-black text-foreground border-4 border-arcade-border hover:border-arcade-yellow hover:text-arcade-yellow",
  ghost:
    "bg-transparent text-court-muted border-4 border-transparent hover:text-foreground hover:border-arcade-border",
  danger:
    "bg-black text-arcade-pink border-4 border-arcade-pink/40 hover:bg-arcade-pink/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 font-arcade text-[8px]",
  md: "px-5 py-2.5 font-arcade text-[9px]",
  lg: "px-8 py-3.5 font-arcade text-[10px]",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-none uppercase tracking-wider transition-all duration-100",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          DECIDING...
        </>
      ) : (
        children
      )}
    </button>
  );
}
