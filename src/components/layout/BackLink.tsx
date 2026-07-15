import Link from "next/link";

interface BackLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackLink({
  href = "/",
  label = "← BACK",
  className = "",
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "touch-target inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-none border-4 border-arcade-border bg-black px-3 py-2 font-arcade text-[8px] uppercase tracking-wider text-court-muted transition-all hover:border-arcade-yellow hover:text-arcade-yellow sm:text-[9px]",
        className,
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
