import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import {
  DEMO_BLOWOUT,
  DEMO_CASE,
  DEMO_JURY,
  DEMO_SCORES,
  DEMO_SIDE_A,
  DEMO_SIDE_B,
  DEMO_VERDICT,
  DEMO_WEIGHTED,
  MAX_WEIGHTED_SCORE,
} from "../data/demoCase";
import { AiDisclosureText } from "./JuryTrapScreens";
import { SCREEN } from "../lib/timeline";
import { RemotionPixelIcon } from "../components/RemotionPixelIcon";
import { ScreenBackground } from "../components/StageBackground";
import { AppChrome } from "../components/AppChrome";
import { TapIndicator } from "../components/TapIndicator";
import { SCREEN_H, SCREEN_W } from "../components/IPhone17Frame";

// Real .verdict-slam CSS keyframe offsets (globals.css), stepped by frame.
const SLAM_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [-6, 4],
  [7, -5],
  [-8, -3],
  [6, 5],
  [-4, 3],
  [4, -3],
  [-3, 2],
  [2, -2],
  [-1, 1],
  [0, 0],
];

// Deterministic stand-ins for the random hit sparks in VerdictView.spawnSparks.
const SPARK_COLORS = ["#00f0ff", "#ff007f", "#ffe600", "#39ff14"];
const LAUGH_SPARKS = [
  { text: "LOL HIT!", color: SPARK_COLORS[2], dx: 0, dy: -8, drift: 18 },
  { text: "LOL", color: SPARK_COLORS[0], dx: -38, dy: 4, drift: -26 },
  { text: "LOL", color: SPARK_COLORS[1], dx: 34, dy: -2, drift: 30 },
  { text: "LOL", color: SPARK_COLORS[3], dx: -18, dy: 10, drift: -12 },
  { text: "LOL", color: SPARK_COLORS[2], dx: 22, dy: 12, drift: 8 },
];
const SHOCK_SPARKS = [
  { text: "+100 PTS", color: SPARK_COLORS[2], dx: 0, dy: -8, drift: -14 },
  { text: "SHK", color: SPARK_COLORS[1], dx: -34, dy: 2, drift: -30 },
  { text: "SHK", color: SPARK_COLORS[0], dx: 36, dy: -4, drift: 24 },
  { text: "SHK", color: SPARK_COLORS[3], dx: -14, dy: 12, drift: 10 },
  { text: "CRITICAL!", color: SPARK_COLORS[1], dx: 26, dy: 10, drift: 16 },
];

function clampFrame(frame: number, from: number, to: number, out: [number, number]) {
  return interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Arcade hit sparks that float up from a reaction button (frame-driven). */
function HitSparks({
  originX,
  originY,
  tapFrame,
  sparks,
}: {
  originX: number;
  originY: number;
  tapFrame: number;
  sparks: typeof LAUGH_SPARKS;
}) {
  const frame = useCurrentFrame();
  const life = 26;
  if (frame < tapFrame || frame > tapFrame + life) return null;
  const t = (frame - tapFrame) / life;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
    >
      {sparks.map((s, i) => {
        const scale = t < 0.3 ? 0.8 + (t / 0.3) * 1.0 : 1.8 - (t - 0.3) * 1.6;
        return (
          <div
            key={i}
            className="absolute font-arcade text-[10px] font-black select-none"
            style={{
              left: originX + s.dx,
              top: originY + s.dy - t * 120,
              transform: `translateX(${t * s.drift}px) scale(${Math.max(0.4, scale)})`,
              opacity: 1 - t,
              color: s.color,
              textShadow: `0 0 8px ${s.color}, 0 2px 0 #000`,
            }}
          >
            {s.text}
          </div>
        );
      })}
    </div>
  );
}

/** Compact fighter scorecard — mirrors SideFighterCard (compact + hideSprite). */
function FighterCardR({
  side,
  revealFrame,
}: {
  side: "A" | "B";
  revealFrame: number;
}) {
  const frame = useCurrentFrame();
  const isWinner = side === DEMO_VERDICT.winner_side;
  const data = side === "A" ? DEMO_SIDE_A : DEMO_SIDE_B;
  const scores = DEMO_SCORES[side];
  const weighted = DEMO_WEIGHTED[side];
  const colorClass = side === "A" ? "text-arcade-blue" : "text-arcade-pink";
  const barColor = side === "A" ? "bg-arcade-blue" : "bg-arcade-pink";
  const frameVariant = isWinner ? "green" : side === "A" ? "blue" : "pink";

  const enter = clampFrame(
    frame,
    revealFrame + (isWinner ? 3 : 6),
    revealFrame + (isWinner ? 13 : 16),
    [0, 1]
  );

  const hpTarget = Math.max(6, Math.round((weighted / MAX_WEIGHTED_SCORE) * 100));
  const hpPercent = interpolate(
    frame,
    [revealFrame + 10, revealFrame + 31],
    [6, hpTarget],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );
  const hpLabel = String(weighted).padStart(2, "0");

  // WINNER chip pulse (replaces animate-pulse)
  const chipPulse = 0.7 + 0.3 * ((Math.sin(frame / 7) + 1) / 2);

  return (
    <article style={{ opacity: enter, transform: `scale(${0.95 + enter * 0.05})` }}>
      <PixelFrame
        variant={frameVariant}
        className={[
          "relative min-w-0 bg-black/80 p-1.5",
          isWinner ? "neon-glow-green" : "opacity-90",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-1 border-b-2 border-arcade-border pb-1">
          <span className={`min-w-0 truncate font-arcade text-[7px] ${colorClass}`}>
            {data.name}
          </span>
          <span
            className={[
              "border-2 px-1.5 py-0.5 font-arcade text-[6px]",
              isWinner
                ? "border-arcade-green bg-arcade-green/20 text-arcade-green"
                : "border-arcade-border bg-black text-foreground/70",
            ].join(" ")}
            style={
              isWinner
                ? { boxShadow: `0 0 8px rgba(57,255,20,${0.6 * chipPulse})`, opacity: 0.75 + 0.25 * chipPulse }
                : undefined
            }
          >
            {isWinner ? "WINNER" : "KO"}
          </span>
        </div>

        <div className="mt-1.5">
          <div className="mb-0.5 flex justify-between font-arcade text-[6px] text-foreground/90">
            <span>JUDGE PWR</span>
            <span>
              {hpLabel}/{MAX_WEIGHTED_SCORE}
            </span>
          </div>
          <div className="h-2.5 border-2 border-arcade-border bg-black p-0.5">
            <div
              className={["h-full", isWinner ? barColor : "bg-arcade-pink/70"].join(" ")}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="mt-0.5 flex justify-between font-mono text-[8px] text-foreground/90">
            <span>LOGIC {scores.logic}/10</span>
            <span>EVID {scores.evidence}/10</span>
          </div>
        </div>

        <div className="mt-1.5">
          <p className="break-words font-mono text-[10px] leading-relaxed text-foreground line-clamp-2">
            {data.argument}
          </p>
        </div>
      </PixelFrame>
    </article>
  );
}

/**
 * THE PEOPLE VS THE JUDGE — mirrors PeopleVsJudgePanel in VerdictView.tsx.
 * Demo tally 2/1 for the winner -> ABSOLUTE CONSENSUS stamp, and the viewer
 * (the trapped friend) bet on the winner -> "YOU CALLED IT".
 */
function PeopleVsJudgePanelR({ revealFrame }: { revealFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = interpolate(frame, [revealFrame + 12, revealFrame + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Stamp: motion scale 1.6 -> 1, rotate -6 -> 0, delay 0.75s
  const stampIn = spring({
    frame: frame - (revealFrame + 24),
    fps,
    config: { damping: 12, stiffness: 200 },
    durationInFrames: 16,
  });

  return (
    <div
      className="shrink-0 border-4 border-arcade-green bg-black/70 p-2 shadow-[0_0_20px_rgba(57,255,20,0.2)]"
      style={{ opacity: enter, transform: `translateY(${(1 - enter) * 8}px)` }}
    >
      <div className="flex flex-col gap-1 border-b-2 border-dotted border-arcade-border pb-1.5">
        <span className="font-arcade text-[6px] uppercase tracking-wider text-foreground/85">
          THE PEOPLE VS THE JUDGE · {DEMO_JURY.jurors} JURORS
        </span>
        <span
          className="font-arcade text-[8px] uppercase tracking-widest text-arcade-green"
          style={{
            opacity: Math.min(1, stampIn * 1.4),
            transform: `scale(${1.6 - stampIn * 0.6}) rotate(${-6 + stampIn * 6}deg)`,
            transformOrigin: "left center",
          }}
        >
          ABSOLUTE CONSENSUS
        </span>
      </div>

      <p className="mt-1.5 font-arcade text-[6px] leading-relaxed uppercase tracking-wider text-arcade-green">
        THE PEOPLE ({DEMO_JURY.pctA}%) AND THE JUDGE STAND AS ONE.
      </p>

      <div className="mt-1.5 flex h-3 w-full overflow-hidden border-2 border-arcade-border bg-black">
        <div className="h-full bg-arcade-blue" style={{ width: `${DEMO_JURY.pctA * enter}%` }} />
        <div className="h-full bg-arcade-pink" style={{ width: `${DEMO_JURY.pctB * enter}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase">
        <span className="truncate pr-2 text-arcade-blue">
          {DEMO_JURY.pctA}% {DEMO_SIDE_A.name}
        </span>
        <span className="truncate pl-2 text-arcade-pink">
          {DEMO_JURY.pctB}% {DEMO_SIDE_B.name}
        </span>
      </div>

      <div className="mt-1.5 space-y-0.5 border-t-2 border-dotted border-arcade-border pt-1 text-center">
        <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-green">
          YOU CALLED IT — JUDGE MATERIAL
        </p>
        <p className="font-arcade text-[6px] uppercase tracking-wider text-court-muted">
          YOU WERE WITH THE {DEMO_JURY.pctA}% MAJORITY
        </p>
      </div>
    </div>
  );
}

/** K.O. reveal overlay — mirrors the isSlamming overlay in VerdictView.tsx. */
function KoOverlay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - SCREEN.koFlash;
  if (local < 0 || frame > SCREEN.koEnd) return null;

  const whiteFlash = clampFrame(local, 0, 11, [1, 0]);
  const overlayFade = clampFrame(frame, SCREEN.koEnd - 8, SCREEN.koEnd, [1, 0]);

  // KO badge: scale [5,1,1.25,1], rotate [-30,10,-5,0] over ~14 frames
  const badgeScale = interpolate(local, [0, 7, 10, 14], [5, 1, 1.25, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const badgeRotate = interpolate(local, [0, 7, 10, 14], [-30, 10, -5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeOpacity = clampFrame(local, 0, 4, [0, 1]);
  const glowPulse = 0.5 + 0.5 * ((Math.sin(frame / 4) + 1) / 2);

  // Winner text: spring in after ~11 frames
  const winnerIn = spring({
    frame: frame - (SCREEN.koWinnerText - 4),
    fps,
    config: { damping: 12, stiffness: 130 },
    durationInFrames: 16,
  });

  // ORDER! gavel: opacity [0,1,1,0] between +5 and +29
  const orderOpacity = interpolate(local, [5, 10, 22, 29], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orderScale = interpolate(local, [5, 10, 29], [0.5, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70"
      style={{ opacity: overlayFade, backdropFilter: "blur(4px)" }}
    >
      {/* Street Fighter style screen white flash */}
      <div className="absolute inset-0 z-50 bg-white" style={{ opacity: whiteFlash }} />

      <div className="relative flex max-w-lg flex-col items-center justify-center px-4">
        <div
          className="relative flex flex-col items-center justify-center"
          style={{
            transform: `scale(${badgeScale}) rotate(${badgeRotate}deg)`,
            opacity: badgeOpacity,
          }}
        >
          <div
            className="absolute inset-0 rounded-full bg-arcade-pink/30"
            style={{ filter: "blur(24px)", opacity: glowPulse }}
          />
          <RemotionPixelIcon
            asset="ko"
            size={180}
            alt="K.O."
            className="relative drop-shadow-[0_0_24px_rgba(255,0,127,0.85)]"
          />
        </div>

        <div
          className="mt-6 text-center font-arcade text-lg tracking-widest text-arcade-yellow"
          style={{
            textShadow: "0 0 12px #ffe600, 0 3px 0 #000",
            opacity: Math.min(1, winnerIn * 1.3),
            transform: `translateY(${(1 - winnerIn) * 30}px) scale(${0.8 + winnerIn * 0.2})`,
          }}
        >
          {DEMO_SIDE_A.name} WINS!
        </div>

        <div
          className="absolute -top-24 flex flex-col items-center gap-1.5"
          style={{ opacity: orderOpacity, transform: `scale(${orderScale})` }}
        >
          <RemotionPixelIcon asset="gavel" size={48} />
          <span className="font-arcade text-[10px] uppercase tracking-widest text-arcade-yellow">
            ORDER!
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 1:1 adaptation of the revealed-verdict state of VerdictView.tsx (mobile
 * branch), incl. the K.O. slam, FLAWLESS VICTORY banner, fighter scorecards,
 * fatal roast, judge analysis, reactions and share actions.
 */
export function VerdictScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = SCREEN.verdictCardsIn;

  // Gavel-slam screen shake (real .verdict-slam keyframes, 16 frames)
  const slamLocal = frame - SCREEN.koFlash;
  const slamIndex =
    slamLocal >= 0 && slamLocal < 16
      ? Math.min(SLAM_OFFSETS.length - 1, Math.floor((slamLocal / 16) * SLAM_OFFSETS.length))
      : SLAM_OFFSETS.length - 1;
  const [slamX, slamY] = SLAM_OFFSETS[slamIndex];

  // CRT flicker
  const flicker = 0.985 + 0.015 * (Math.floor(frame / 2) % 2);

  // Header verdict pop (motion: opacity 0->1, scale .9->1, 0.4s)
  const headIn = clampFrame(frame, reveal - 4, reveal + 8, [0, 1]);

  // Blowout banner (spring scaleX after 0.25s)
  const bannerIn = spring({
    frame: frame - (reveal + 7),
    fps,
    config: { damping: 13, stiffness: 160 },
    durationInFrames: 18,
  });
  const bannerFlash = Math.floor(frame / 15) % 2 === 0;

  // Roast + analysis entrances (0.5s / 0.3s delays in the real component)
  const roastIn = spring({
    frame: frame - (reveal + 15),
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 18,
  });
  const analysisIn = clampFrame(frame, reveal + 9, reveal + 21, [0, 1]);

  // Scroll down to the reactions/share section
  const scrollY = interpolate(
    frame,
    [SCREEN.scrollStart, SCREEN.scrollEnd],
    [0, 385],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Reaction counts + share button state
  const laughCount = frame >= SCREEN.tapLaugh + 2 ? 1 : 0;
  const shockCount = frame >= SCREEN.tapShock + 2 ? 1 : 0;
  const sharing = frame >= SCREEN.tapShare + 2;

  const pressAt = (tapFrame: number) =>
    interpolate(frame, [tapFrame - 1, tapFrame + 2, tapFrame + 8], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const reactions = [
    { type: "shock", label: "Shock", asset: "shock" as const, count: shockCount, tap: SCREEN.tapShock },
    { type: "laugh", label: "Laugh", asset: "laugh" as const, count: laughCount, tap: SCREEN.tapLaugh },
    { type: "agree", label: "Agree", asset: "agree" as const, count: 0, tap: -1000 },
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: SCREEN_W, height: SCREEN_H }}
    >
      <ScreenBackground route="case" />
      <AppChrome />

      <main
        className="page-shell-narrow relative z-10 items-stretch justify-start py-2"
        style={{ paddingTop: 58, paddingBottom: 18 }}
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2 pr-14">
            <span className="touch-target inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-none border-4 border-arcade-border bg-black px-3 py-2 font-arcade text-[8px] uppercase tracking-wider text-court-muted">
              ← BACK
            </span>
            <span className="touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-none border-4 border-arcade-border bg-black px-2.5 py-2 font-arcade text-[7px] uppercase tracking-wider text-court-muted">
              REPORT THIS CASE
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">
            <article
              className="arcade-panel arcade-screen neon-glow-yellow relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none"
              style={{
                opacity: flicker,
                transform: `translate(${slamX}px, ${slamY}px)`,
              }}
            >
              <div className="arcade-grid absolute inset-0 -z-10 opacity-20" />

              {/* Header banner */}
              <header className="relative shrink-0 border-b-4 border-arcade-border bg-black/80 px-3 py-2 text-center">
                <p className="font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow">
                  JUDGMENT DELIVERED
                </p>
                <h1
                  className="mt-1 break-words font-arcade text-[10px] uppercase leading-relaxed tracking-wider text-white line-clamp-2"
                  style={{ opacity: headIn, transform: `scale(${0.9 + headIn * 0.1})` }}
                >
                  {DEMO_VERDICT.short_verdict}
                </h1>
                <p className="mt-1 break-words px-1 font-mono text-[10px] uppercase tracking-wide text-foreground/85 line-clamp-1">
                  CASE #0042 · {DEMO_CASE.categoryLabel} · {DEMO_CASE.title}
                </p>
              </header>

              {/* Blowout banner — FLAWLESS VICTORY (margin 9 >= 8) */}
              {DEMO_BLOWOUT !== "standard" && (
                <div
                  className="shrink-0 border-b-4 border-arcade-yellow bg-arcade-yellow/15 py-1 text-center font-arcade text-[8px] tracking-[0.15em] text-arcade-yellow"
                  style={{
                    opacity: Math.min(1, bannerIn * 1.2),
                    transform: `scaleX(${0.4 + bannerIn * 0.6})`,
                  }}
                >
                  <span style={{ opacity: bannerFlash ? 1 : 0.25 }}>
                    FLAWLESS VICTORY
                  </span>
                </div>
              )}

              {/* Scrollable body (scroll re-driven by frames) */}
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                  className="px-3 py-2"
                  style={{ transform: `translateY(${-scrollY}px)` }}
                >
                  {/* VS Battle */}
                  <div className="flex shrink-0 flex-col border-b-4 border-double border-arcade-border pb-2">
                    <div className="relative grid grid-cols-[1fr_auto_1fr] items-end gap-0">
                      <div className="flex justify-end pr-0.5">
                        <RemotionPixelIcon
                          asset="fighterP1"
                          size={64}
                          alt="Player 1"
                          className="drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                        />
                      </div>
                      <div className="flex items-center justify-center self-center px-0.5 pb-3">
                        <RemotionPixelIcon asset="vs" size={40} alt="VS" />
                      </div>
                      <div className="flex justify-start pl-0.5">
                        <RemotionPixelIcon
                          asset="fighterP2"
                          size={64}
                          alt="Player 2"
                          className="-scale-x-100 opacity-85"
                        />
                      </div>
                    </div>

                    <div className="mt-2 grid min-w-0 grid-cols-2 gap-1.5">
                      <FighterCardR side="A" revealFrame={reveal} />
                      <FighterCardR side="B" revealFrame={reveal} />
                    </div>

                    <div
                      className="mt-2"
                      style={{
                        opacity: Math.min(1, roastIn * 1.2),
                        transform: `scale(${0.95 + roastIn * 0.05})`,
                      }}
                    >
                      <PixelFrame variant="crimson" className="bg-black/90 p-2.5">
                        <div className="flex items-center gap-2 border-b-2 border-dotted border-court-crimson/50 pb-1">
                          <span className="text-[14px]">🔥</span>
                          <span className="font-arcade text-[7px] uppercase tracking-widest text-court-crimson">
                            FATAL ROAST
                          </span>
                          <span className="text-[14px]">🔥</span>
                        </div>
                        <p className="mt-2 break-words border-l-4 border-court-crimson pl-2 font-display text-xs font-black italic leading-snug text-white">
                          &ldquo;{DEMO_VERDICT.roast_line}&rdquo;
                        </p>
                      </PixelFrame>
                    </div>
                  </div>

                  {/* Judge analysis */}
                  <div className="flex min-w-0 flex-col gap-2 pt-2">
                    <div
                      className="arcade-panel neon-glow-blue relative border-4 border-arcade-border bg-black p-2 font-mono text-[11px] leading-relaxed"
                      style={{
                        opacity: analysisIn,
                        transform: `translateY(${(1 - analysisIn) * 10}px)`,
                      }}
                    >
                      <div className="absolute left-2 top-0 -translate-y-1/2 border-x-4 border-arcade-border bg-black px-1.5 font-arcade text-[7px] uppercase tracking-wider text-foreground/90">
                        JUDGE ANALYSIS
                      </div>
                      <p className="break-words text-foreground line-clamp-4">
                        {DEMO_VERDICT.full_reasoning}
                      </p>
                    </div>

                    {/* THE PEOPLE VS THE JUDGE — crowd consensus vs AI ruling */}
                    <PeopleVsJudgePanelR revealFrame={reveal} />
                  </div>

                  {/* Reactions + actions */}
                  <div className="mt-2 space-y-2 border-t-4 border-double border-arcade-border pt-2">
                    <div className="text-center">
                      <p className="mb-1.5 font-arcade text-[7px] uppercase tracking-widest text-foreground/85">
                        RATE THE EXECUTION
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {reactions.map((r) => {
                          const press = pressAt(r.tap);
                          return (
                            <div
                              key={r.type}
                              className="touch-target inline-flex items-center justify-center gap-1.5 border-4 border-arcade-border bg-black px-2 py-2"
                              style={{
                                transform: `scale(${1 - press * 0.06})`,
                                borderColor: press > 0.15 ? "#ffe600" : undefined,
                              }}
                            >
                              <RemotionPixelIcon asset={r.asset} size={18} />
                              <span className="font-arcade text-[7px] uppercase text-foreground/90">
                                {r.label}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-arcade-yellow">
                                {r.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="touch-target w-full border-4 border-arcade-border bg-black px-3 py-2 text-center font-arcade text-[8px] uppercase text-foreground">
                        COPY LINK
                      </div>
                      <div className="touch-target w-full border-4 border-arcade-border bg-black px-3 py-2 text-center font-arcade text-[8px] uppercase text-foreground">
                        BRAG TEXT
                      </div>
                      <div className="touch-target w-full border-4 border-arcade-border bg-black px-3 py-2 text-center font-arcade text-[8px] uppercase text-foreground">
                        SHAME TEXT
                      </div>
                      <div
                        className="touch-target inline-flex w-full items-center justify-center gap-2 border-4 border-arcade-yellow bg-arcade-yellow px-3 py-2 font-arcade text-[8px] uppercase text-black"
                        style={{
                          transform: `scale(${1 - pressAt(SCREEN.tapShare) * 0.05})`,
                          opacity: sharing ? 0.75 : 1,
                        }}
                      >
                        {sharing ? "SHARING…" : "SHARE CARD"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <footer className="relative shrink-0 border-t-4 border-arcade-border bg-black/40 px-3 py-1.5 text-center">
                <p>
                  <AiDisclosureText />
                </p>
                <p className="mt-1 break-all font-arcade text-[6px] uppercase tracking-wider text-foreground/80">
                  CASE_#0042 · {DEMO_SIDE_A.name} WINS · SHAME_HEAT_28 · COIN_OP_SYSTEM
                </p>
                <div className="mt-1">
                  <BuilderCredit />
                </div>
              </footer>
            </article>
          </div>
        </div>
      </main>

      {/* K.O. reveal overlay — covers the full screen like the real fixed overlay */}
      <KoOverlay />

      {/* Hit sparks above everything (screen coords) */}
      <HitSparks
        originX={196}
        originY={490}
        tapFrame={SCREEN.tapLaugh}
        sparks={LAUGH_SPARKS}
      />
      <HitSparks
        originX={85}
        originY={490}
        tapFrame={SCREEN.tapShock}
        sparks={SHOCK_SPARKS}
      />

      {/* Tap choreography */}
      <TapIndicator x={196} y={491} tapFrame={SCREEN.tapLaugh} />
      <TapIndicator x={83} y={491} tapFrame={SCREEN.tapShock} />
      <TapIndicator x={196} y={692} tapFrame={SCREEN.tapShare} />
    </div>
  );
}
