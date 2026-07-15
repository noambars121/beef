import Link from "next/link";
import { PixelIcon } from "@/components/pixel/PixelIcon";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-black bg-black/55 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <PixelIcon asset="scales" size={28} alt="" className="sm:hidden" />
          <PixelIcon asset="scales" size={36} alt="" className="hidden sm:block" priority />
          <div className="min-w-0">
            <p className="truncate font-arcade text-[8px] tracking-wider text-arcade-yellow sm:text-xs">
              BEEF
            </p>
            <p className="hidden truncate text-[8px] font-arcade uppercase tracking-widest text-court-muted sm:mt-0.5 sm:block">
              COIN_OP_DECISION_ENGINE
            </p>
          </div>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/case/new"
            className="touch-target inline-flex items-center justify-center gap-1.5 rounded-none border-2 border-arcade-blue px-2.5 py-2 font-arcade text-[7px] uppercase tracking-wider text-arcade-blue transition-colors hover:bg-arcade-blue hover:text-black sm:border-4 sm:px-3 sm:text-[9px]"
          >
            <PixelIcon asset="coin" size={16} alt="" className="hidden sm:inline-block" />
            <span className="hidden sm:inline">INSERT_CASE</span>
            <span className="sm:hidden">NEW</span>
          </Link>
          <Link
            href="/gallery"
            className="touch-target inline-flex items-center justify-center gap-1.5 rounded-none border-2 border-arcade-pink px-2.5 py-2 font-arcade text-[7px] uppercase tracking-wider text-arcade-pink transition-colors hover:bg-arcade-pink hover:text-black sm:border-4 sm:px-3 sm:text-[9px]"
          >
            <PixelIcon asset="shameSkull" size={16} alt="" className="hidden sm:inline-block" />
            <span className="hidden sm:inline">HALL_OF_SHAME</span>
            <span className="sm:hidden">HALL</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
