import { Easing, interpolate, useCurrentFrame } from "remotion";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { DEMO_HALL, type HallEntry } from "../data/demoCase";
import { SCREEN } from "../lib/timeline";
import { RemotionPixelIcon } from "../components/RemotionPixelIcon";
import { ScreenBackground } from "../components/StageBackground";
import { AppChrome } from "../components/AppChrome";
import { SCREEN_H, SCREEN_W } from "../components/IPhone17Frame";

/**
 * HALL OF SHAME — 1:1 adaptation of src/app/gallery/page.tsx +
 * HallOfShameTable.tsx (mobile layout): banner header, stat pills, podium
 * cards, then the arcade scoreboard with the video's case crowned #1.
 * Frame-driven: staggered entrances + an internal scroll to the board.
 */

function clampFrame(frame: number, from: number, to: number, out: [number, number]) {
  return interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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
    <div className={["border bg-black/70 px-1 py-0.5 text-center", colorClass].join(" ")}>
      <p className="font-arcade text-[9px] leading-none">{value}</p>
      <p className="mt-0.5 font-arcade text-[4px] leading-none text-court-muted">{label}</p>
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  highlight = false,
  enterAt,
}: {
  entry: HallEntry;
  place: 1 | 2 | 3;
  highlight?: boolean;
  enterAt: number;
}) {
  const frame = useCurrentFrame();
  const enter = clampFrame(frame, enterAt, enterAt + 9, [0, 1]);
  const variant = place === 1 ? "yellow" : place === 2 ? "blue" : "pink";
  // #1 gets a crowning pulse right after it lands
  const crown =
    highlight && frame >= enterAt + 9
      ? 1 + 0.02 * Math.sin(((frame - enterAt - 9) / 22) * Math.PI * 2)
      : 1;

  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * 14}px) scale(${crown})`,
      }}
    >
      <PixelFrame
        variant={variant}
        className={[
          "bg-black/80 p-1.5 text-center",
          highlight ? "shadow-[0_0_20px_rgba(255,230,0,0.18)]" : "",
        ].join(" ")}
      >
        <RemotionPixelIcon
          asset={place === 1 ? "rank1" : place === 2 ? "rank2" : "rank3"}
          size={place === 1 ? 36 : 28}
          className="mx-auto"
        />
        <p className="mt-0.5 break-words font-arcade text-[6px] leading-snug text-arcade-yellow">
          {entry.title}
        </p>
        <p className="mt-0.5 break-words font-mono text-[8px] italic leading-snug text-arcade-pink">
          &ldquo;{entry.roast}&rdquo;
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5 border-t-2 border-arcade-border pt-1">
          <RemotionPixelIcon
            asset={entry.winnerSide === "A" ? "fighterP1" : "fighterP2"}
            size={16}
          />
          <span className="min-w-0 truncate font-arcade text-[6px] text-court-muted">
            {entry.winnerName}
          </span>
          <span className="shrink-0 font-arcade text-[7px] text-arcade-yellow">
            {entry.heat} PTS
          </span>
        </div>
      </PixelFrame>
    </div>
  );
}

function ShameRow({
  entry,
  rankIndex,
  enterAt,
}: {
  entry: HallEntry;
  rankIndex: number;
  enterAt: number;
}) {
  const frame = useCurrentFrame();
  const enter = clampFrame(frame, enterAt, enterAt + 8, [0, 1]);
  const medal = rankIndex === 0 ? "rank1" : rankIndex === 1 ? "rank2" : rankIndex === 2 ? "rank3" : null;
  const rowTone =
    rankIndex === 0
      ? "shame-row-gold"
      : rankIndex === 1
        ? "shame-row-silver"
        : rankIndex === 2
          ? "shame-row-bronze"
          : "";
  const reactions = [
    { asset: "shock" as const, count: entry.reactions.shock },
    { asset: "laugh" as const, count: entry.reactions.laugh },
    { asset: "agree" as const, count: entry.reactions.agree },
  ];

  return (
    <li style={{ opacity: enter, transform: `translateX(${(1 - enter) * 16}px)` }}>
      <div className={`shame-row ${rowTone} ${rankIndex < 3 ? "shame-row-podium" : ""}`}>
        <div className="shame-cell shame-cell-rank">
          {medal ? (
            <RemotionPixelIcon asset={medal} size={28} />
          ) : (
            <span className="font-arcade text-[9px] text-court-muted">
              #{String(rankIndex + 1).padStart(2, "0")}
            </span>
          )}
        </div>

        <div className="shame-cell shame-cell-case">
          <div className="mb-0.5 flex flex-wrap items-center gap-1">
            <span className="border border-arcade-border px-1 py-px font-arcade text-[5px] uppercase tracking-wider text-court-muted">
              {entry.docket}
            </span>
            <span className="border border-arcade-border px-1 py-px font-arcade text-[5px] uppercase tracking-wider text-court-muted">
              {entry.category}
            </span>
            <span className="font-arcade text-[6px] uppercase tracking-wider text-arcade-yellow/80">
              {entry.heat} PTS
            </span>
          </div>
          <p className="w-full break-words font-mono text-[11px] font-bold leading-tight text-foreground">
            {entry.title}
          </p>
          <p className="mt-0.5 w-full break-words font-mono text-[9px] italic leading-snug text-arcade-pink">
            &ldquo;{entry.roast}&rdquo;
          </p>
          <div className="mt-1 flex w-full items-center gap-2">
            <span className="inline-flex min-w-0 items-center gap-0.5 font-arcade text-[6px] text-court-muted">
              <RemotionPixelIcon
                asset={entry.winnerSide === "A" ? "fighterP1" : "fighterP2"}
                size={14}
              />
              <span className="truncate">{entry.winnerName}</span>
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              {reactions.map((r) => (
                <span
                  key={r.asset}
                  className="inline-flex items-center gap-0.5 font-mono text-[8px] text-court-muted"
                >
                  <RemotionPixelIcon asset={r.asset} size={10} />
                  {r.count}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function HallOfShameScreen() {
  const frame = useCurrentFrame();
  const base = SCREEN.hallFrom;

  // Internal scroll: banner + podium first, then down to the scoreboard
  const scrollY = interpolate(
    frame,
    [SCREEN.hallScrollStart, SCREEN.hallScrollEnd],
    [0, 370],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const bannerIn = clampFrame(frame, base, base + 8, [0, 1]);
  const skullBob = Math.floor(frame / 8) % 2 === 0 ? 0 : -2;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: SCREEN_W, height: SCREEN_H }}
    >
      <ScreenBackground route="hall" />
      <AppChrome />

      <main
        className="page-shell-gallery relative z-10"
        style={{ paddingTop: 58, paddingBottom: 12, overflow: "hidden", height: SCREEN_H }}
      >
        {/* Clip the scroll INSIDE the padded area so content never rides over the status bar */}
        <div style={{ overflow: "hidden", height: "100%" }}>
          <div style={{ transform: `translateY(${-scrollY}px)` }}>
          <span className="touch-target !min-h-0 inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-none border-4 border-arcade-border bg-black px-2 py-1 font-arcade text-[7px] uppercase tracking-wider text-court-muted">
            ← BACK
          </span>

          <header
            className="gallery-header"
            style={{ opacity: bannerIn, transform: `scale(${0.94 + bannerIn * 0.06})` }}
          >
            <div className="relative flex items-end justify-center gap-1.5 px-1">
              <div style={{ transform: `translateY(${skullBob}px)` }} className="mb-0.5">
                <RemotionPixelIcon asset="shameSkull" size={14} />
              </div>
              <RemotionPixelIcon asset="hallBanner" size={200} height={112} />
              <div style={{ transform: `translateY(${skullBob}px)` }} className="mb-0.5">
                <RemotionPixelIcon asset="shameSkull" size={14} />
              </div>
            </div>

            <p className="mx-auto mt-0.5 max-w-xl px-2 text-center font-mono text-[8px] uppercase leading-relaxed tracking-wide text-court-muted">
              The internet&apos;s worst arguments, ranked by virality.
            </p>

            <div className="mx-auto mt-1.5 grid w-full max-w-[240px] grid-cols-3 gap-1">
              <StatPill label="CASES" value={String(DEMO_HALL.length)} color="yellow" />
              <StatPill label="TOP SCORE" value={String(DEMO_HALL[0].heat)} color="pink" />
              <StatPill label="MERCY" value="00" color="blue" />
            </div>
          </header>

          <div className="gallery-main">
            <div className="mt-2">
              {/* Mobile podium stack: #2, crowned #1, #3 (real DOM order) */}
              <div className="mb-2 grid grid-cols-1 gap-1.5">
                <PodiumCard entry={DEMO_HALL[1]} place={2} enterAt={base + 6} />
                <PodiumCard entry={DEMO_HALL[0]} place={1} enterAt={base + 10} highlight />
                <PodiumCard entry={DEMO_HALL[2]} place={3} enterAt={base + 14} />
              </div>

              <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
                <p className="inline-flex items-center gap-1.5 font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow">
                  <RemotionPixelIcon asset="shameSkull" size={12} />
                  FULL SCOREBOARD
                </p>
              </div>

              {/* HallOfShameTable (search + board) */}
              <div className="space-y-2">
                <div className="flex items-stretch border-4 border-arcade-border bg-black">
                  <span className="flex items-center border-r-4 border-arcade-border px-2.5 text-arcade-yellow">
                    <RemotionPixelIcon asset="shameSkull" size={14} />
                  </span>
                  <span className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-court-muted">
                    SEARCH CASES, ROASTS, FIGHTERS…
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 px-0.5">
                  <p className="font-arcade text-[6px] uppercase tracking-wider text-court-muted">
                    {DEMO_HALL.length} ENTRIES
                  </p>
                </div>

                <div className="shame-board">
                  <ul className="shame-board-body">
                    {DEMO_HALL.map((entry, i) => (
                      <ShameRow
                        key={entry.docket}
                        entry={entry}
                        rankIndex={i}
                        enterAt={SCREEN.hallScrollStart + 2 + i * 4}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
