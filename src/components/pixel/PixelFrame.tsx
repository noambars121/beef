import type { ReactNode } from "react";

type PixelFrameVariant = "default" | "blue" | "pink" | "yellow" | "green" | "crimson";

const variantBorder: Record<PixelFrameVariant, string> = {
  default: "pixel-frame",
  blue: "pixel-frame pixel-frame-blue",
  pink: "pixel-frame pixel-frame-pink",
  yellow: "pixel-frame pixel-frame-yellow",
  green: "pixel-frame pixel-frame-green",
  crimson: "pixel-frame pixel-frame-crimson",
};

interface PixelFrameProps {
  children: ReactNode;
  variant?: PixelFrameVariant;
  className?: string;
  as?: "div" | "article" | "section" | "main";
}

export function PixelFrame({
  children,
  variant = "default",
  className = "",
  as: Tag = "div",
}: PixelFrameProps) {
  return (
    <Tag className={`${variantBorder[variant]} ${className}`.trim()}>
      <span className="pixel-corner pixel-corner-tl" aria-hidden />
      <span className="pixel-corner pixel-corner-tr" aria-hidden />
      <span className="pixel-corner pixel-corner-bl" aria-hidden />
      <span className="pixel-corner pixel-corner-br" aria-hidden />
      {children}
    </Tag>
  );
}
