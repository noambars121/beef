import Link from "next/link";
import { BackLink } from "@/components/layout/BackLink";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import { HallOfShameTable } from "@/components/gallery/HallOfShameTable";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { listGalleryEntries, type GalleryEntry } from "@/lib/store/db";
import { effectiveWinnerSide, partyLabel } from "@/types";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const entries = await listGalleryEntries();
  const topViral = entries[0]?.heat ?? 0;

  return (
    <main className="page-shell-gallery">
      <BackLink className="!min-h-0 shrink-0 px-2 py-1 text-[7px] sm:text-[8px]" />

      <header className="gallery-header">
        <div className="relative flex items-end justify-center gap-1.5 px-1 sm:gap-2">
          <PixelIcon asset="shameSkull" size={14} alt="" className="mb-0.5 pixel-bob sm:hidden" />
          <PixelIcon asset="shameSkull" size={16} alt="" className="mb-1 pixel-bob hidden sm:block" />
          <PixelIcon
            asset="hallBanner"
            size={200}
            height={112}
            alt="Hall of Shame"
            priority
            className="max-w-[min(72vw,220px)] sm:hidden"
          />
          <PixelIcon
            asset="hallBanner"
            size={260}
            height={145}
            alt="Hall of Shame"
            priority
            className="hidden max-w-[min(70vw,280px)] sm:block"
          />
          <PixelIcon asset="shameSkull" size={14} alt="" className="mb-0.5 pixel-bob sm:hidden" />
          <PixelIcon asset="shameSkull" size={16} alt="" className="mb-1 pixel-bob hidden sm:block" />
        </div>

        <p className="mx-auto mt-0.5 max-w-xl px-2 text-center font-mono text-[8px] uppercase leading-relaxed tracking-wide text-court-muted sm:text-[9px]">
          The internet&apos;s worst arguments, ranked by virality.
        </p>

        {entries.length > 0 && (
          <div className="mx-auto mt-1.5 grid w-full max-w-[240px] grid-cols-3 gap-1 sm:mt-2 sm:max-w-[280px] sm:gap-1.5">
            <StatPill label="CASES" value={String(entries.length)} color="yellow" />
            <StatPill label="TOP SCORE" value={String(topViral)} color="pink" />
            <StatPill label="MERCY" value="00" color="blue" />
          </div>
        )}
      </header>

      <div className="gallery-main">
        {entries.length === 0 ? (
          <PixelFrame variant="pink" className="mt-3 flex flex-col items-center justify-center p-6 text-center sm:p-8">
            <PixelIcon asset="shameTrophy" size={72} alt="" className="mx-auto" />
            <p className="mt-3 font-arcade text-xs text-arcade-pink sm:text-sm">NO SHAME YET</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-court-muted sm:text-xs">
              The board is empty. File a case and earn your disgrace.
            </p>
            <Link
              href="/case/new"
              className="touch-target mt-4 inline-flex items-center justify-center gap-2 border-4 border-arcade-pink bg-black px-3 py-2 font-arcade text-[7px] uppercase text-arcade-pink hover:bg-arcade-pink hover:text-black sm:text-[8px]"
            >
              <PixelIcon asset="coin" size={14} alt="" />
              INSERT FIRST CASE →
            </Link>
          </PixelFrame>
        ) : (
          <div className="mt-2 sm:mt-3">
            {entries.length >= 1 && (
              <div className="mb-2 grid grid-cols-1 gap-1.5 sm:mb-3 sm:grid-cols-3 sm:items-end sm:gap-2">
                <PodiumCard entry={entries[1]} place={2} className="sm:order-1 sm:translate-y-1" />
                <PodiumCard entry={entries[0]} place={1} className="sm:order-2" highlight />
                <PodiumCard entry={entries[2]} place={3} className="sm:order-3 sm:translate-y-2" />
              </div>
            )}

            <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
              <p className="inline-flex items-center gap-1.5 font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow sm:text-[8px]">
                <PixelIcon asset="shameSkull" size={12} alt="" />
                FULL SCOREBOARD
              </p>
            </div>

            <HallOfShameTable entries={entries} />
          </div>
        )}

        {/* Credit scrolls with content — must not steal flex height from the board */}
        <p className="mt-4 pb-2 text-center">
          <BuilderCredit />
        </p>
      </div>
    </main>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "yellow" | "pink" | "blue";
}) {
  const colorClass =
    color === "yellow"
      ? "border-arcade-yellow/60 text-arcade-yellow"
      : color === "pink"
        ? "border-arcade-pink/60 text-arcade-pink"
        : "border-arcade-blue/60 text-arcade-blue";

  return (
    <div className={["border bg-black/70 px-1 py-0.5 text-center sm:px-1.5", colorClass].join(" ")}>
      <p className="font-arcade text-[9px] leading-none sm:text-[10px]">{value}</p>
      <p className="mt-0.5 font-arcade text-[4px] leading-none text-court-muted sm:text-[5px]">
        {label}
      </p>
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  highlight = false,
  className = "",
}: {
  entry?: GalleryEntry;
  place: 1 | 2 | 3;
  highlight?: boolean;
  className?: string;
}) {
  if (!entry) {
    return (
      <div
        className={`hidden border-4 border-dashed border-arcade-border/50 bg-black/30 p-2 text-center sm:block ${className}`}
      >
        <PixelIcon
          asset={place === 1 ? "rank1" : place === 2 ? "rank2" : "rank3"}
          size={28}
          alt=""
          className="mx-auto opacity-30"
        />
        <p className="mt-0.5 font-arcade text-[6px] text-court-muted">VACANT</p>
      </div>
    );
  }

  const { case: caseRecord, parties, verdict, appeal, heat } = entry;
  const variant = place === 1 ? "yellow" : place === 2 ? "blue" : "pink";

  const finalWinner = effectiveWinnerSide(verdict, appeal);
  const winnerParty = parties.find((p) => p.side === finalWinner);
  const winnerName = partyLabel(finalWinner, winnerParty?.display_name);
  const roast = appeal?.roast_line ?? verdict.roast_line;

  return (
    <Link href={`/case/${caseRecord.id}`} className={`block ${className}`}>
      <PixelFrame
        variant={variant}
        className={[
          "bg-black/80 p-1.5 text-center transition-transform hover:-translate-y-0.5 sm:p-2",
          highlight ? "shadow-[0_0_20px_rgba(255,230,0,0.18)]" : "",
        ].join(" ")}
      >
        <PixelIcon
          asset={place === 1 ? "rank1" : place === 2 ? "rank2" : "rank3"}
          size={place === 1 ? 36 : 28}
          alt={`#${place}`}
          className="mx-auto"
        />
        <p className="mt-0.5 break-words font-arcade text-[6px] leading-snug text-arcade-yellow sm:text-[7px]">
          {caseRecord.title}
        </p>
        <p className="mt-0.5 break-words font-mono text-[8px] italic leading-snug text-arcade-pink sm:text-[9px]">
          &ldquo;{roast}&rdquo;
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5 border-t-2 border-arcade-border pt-1">
          <PixelIcon
            asset={finalWinner === "A" ? "fighterP1" : "fighterP2"}
            size={16}
            alt=""
          />
          <span className="min-w-0 truncate font-arcade text-[6px] text-court-muted">
            {winnerName}
          </span>
          <span className="shrink-0 font-arcade text-[7px] text-arcade-yellow">{heat} PTS</span>
        </div>
      </PixelFrame>
    </Link>
  );
}
