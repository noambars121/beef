import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import {
  DEMO_CASE,
  DEMO_DELIBERATION_LOGS,
  DEMO_JURY,
  DEMO_SIDE_A,
  DEMO_SIDE_B,
  formatCountdown,
} from "../data/demoCase";
import { SCREEN } from "../lib/timeline";
import { RemotionPixelIcon } from "../components/RemotionPixelIcon";
import { ScreenBackground } from "../components/StageBackground";
import { AppChrome } from "../components/AppChrome";
import { TapIndicator } from "../components/TapIndicator";
import { SCREEN_H, SCREEN_W } from "../components/IPhone17Frame";

const CASE_META = `CASE #0042 · ${DEMO_CASE.categoryLabel} · ${DEMO_CASE.title}`;

function clampFrame(frame: number, from: number, to: number, out: [number, number]) {
  return interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Case-page wrapper (page-shell-narrow + BACK / REPORT chrome). */
function CasePageShell({
  children,
  overlay,
}: {
  children: ReactNode;
  /** Rendered at screen root level (for tap indicators in screen coords). */
  overlay?: ReactNode;
}) {
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">{children}</div>
        </div>
      </main>

      {overlay}
    </div>
  );
}

/** Mirrors the AiDisclosureTag link in VerdictView (static in the video). */
export function AiDisclosureText() {
  return (
    <span className="inline-block font-mono text-[9px] uppercase tracking-wide text-court-muted underline decoration-court-muted/40 underline-offset-2">
      AI ENTERTAINMENT VERDICT — NOT A REAL LEGAL RULING
    </span>
  );
}

/** Mirrors CrowdHeatBar in VerdictView.tsx, frame-driven. */
function CrowdHeatBarR({
  jurors,
  pctA,
  pctB,
  barsInAt,
}: {
  jurors: number;
  pctA: number;
  pctB: number;
  barsInAt?: number;
}) {
  const frame = useCurrentFrame();
  const empty = jurors === 0;
  // Empty-state pulse (motion opacity [0.15, 0.35, 0.15] over 1.6s)
  const pulse = 0.15 + 0.1 * (Math.sin((frame / 48) * Math.PI * 2) + 1);
  // Bars grow in like the real transition-all duration-700
  const grow =
    barsInAt !== undefined ? clampFrame(frame, barsInAt, barsInAt + 21, [0, 1]) : 1;

  return (
    <div className="border-4 border-arcade-border bg-black/70 p-2 text-left">
      <div className="flex items-center justify-between font-arcade text-[6px] uppercase tracking-wider text-foreground/85">
        <span>CROWD HEAT · LIVE</span>
        <span>
          {jurors} JUROR{jurors === 1 ? "" : "S"}
        </span>
      </div>
      <div className="mt-1.5 flex h-3 w-full overflow-hidden border-2 border-arcade-border bg-black">
        {empty ? (
          <div className="h-full w-full bg-court-muted/40" style={{ opacity: pulse }} />
        ) : (
          <>
            <div className="h-full bg-arcade-blue" style={{ width: `${pctA * grow}%` }} />
            <div className="h-full bg-arcade-pink" style={{ width: `${pctB * grow}%` }} />
          </>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase">
        <span className="truncate pr-2 text-arcade-blue">
          {empty ? 0 : pctA}% {DEMO_SIDE_A.name}
        </span>
        <span className="truncate pl-2 text-right text-arcade-pink">
          {empty ? 0 : pctB}% {DEMO_SIDE_B.name}
        </span>
      </div>
      {empty && (
        <p className="mt-1 text-center font-arcade text-[6px] uppercase tracking-widest text-court-muted">
          AWAITING JURORS — SHARE THE LINK
        </p>
      )}
    </div>
  );
}

/** The big crimson countdown box (motion pulse re-driven by frames). */
function CountdownBox({ ms }: { ms: number }) {
  const frame = useCurrentFrame();
  const pulseT = (Math.sin((frame / 30) * Math.PI * 2) + 1) / 2;
  const scale = 1 + 0.05 * pulseT;
  const opacity = 1 - 0.18 * pulseT;

  return (
    <div
      className="mt-2 border-4 border-court-crimson bg-black px-5 py-3 font-arcade text-2xl tabular-nums text-court-crimson"
      style={{
        transform: `scale(${scale})`,
        opacity,
        textShadow: "0 0 16px rgba(255,32,64,0.85), 0 0 42px rgba(255,32,64,0.4)",
        boxShadow: "0 0 22px rgba(255,32,64,0.35), inset 0 0 14px rgba(255,32,64,0.2)",
      }}
    >
      {formatCountdown(ms)}
    </div>
  );
}

/**
 * JURY BOX — 1:1 adaptation of STATE B in VerdictView.tsx.
 * `variant="owner"`: 0 jurors, "THE CROWD IS JUDGING YOUR BEEF." + judge status.
 * `variant="voter"`: bet placed, live crowd heat, clock spins to zero and the
 * judge enters the court (unsealing state).
 */
export function JuryBoxScreen({ variant }: { variant: "owner" | "voter" }) {
  const frame = useCurrentFrame();

  // ---- Countdown value ----
  let remainingMs: number;
  if (variant === "owner") {
    const elapsed = ((frame - SCREEN.juryOwnerFrom) / 30) * 1000;
    remainingMs = DEMO_JURY.ownerCountdownStartMs - elapsed;
  } else {
    const elapsed = ((frame - SCREEN.juryVoterFrom) / 30) * 1000;
    const natural = DEMO_JURY.voterCountdownStartMs - elapsed;
    // Cinematic time-skip: the clock spins down to zero
    const spin = interpolate(frame, [SCREEN.jurySpinStart, SCREEN.jurySpinEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const eased = spin * spin * (3 - 2 * spin); // smoothstep
    remainingMs = natural * (1 - eased);
    if (frame >= SCREEN.jurySpinEnd) remainingMs = 0;
  }

  const unsealing = variant === "voter" && frame >= SCREEN.juryUnsealFrom;

  // CRT flicker + unseal shake
  const flicker = 0.978 + 0.022 * (Math.floor(frame / 2) % 2);
  const unsealShake = unsealing
    ? 6 * Math.exp(-(frame - SCREEN.juryUnsealFrom) / 7)
    : 0;
  const shakeX = Math.sin(frame * 2.7) * unsealShake;

  // Flash header (text-flash)
  const flashOn = Math.floor(frame / 15) % 2 === 0;

  // Owner judge-status line cycles the deliberation logs with progress
  const statusIndex =
    Math.floor((frame - SCREEN.juryOwnerFrom) / 34) % DEMO_DELIBERATION_LOGS.length;
  const statusProgress = Math.round(
    clampFrame(frame, SCREEN.juryOwnerFrom, SCREEN.juryOwnerTo, [34, 82])
  );

  // Unseal entrance (motion scale 0.9 -> 1)
  const unsealIn = clampFrame(frame, SCREEN.juryUnsealFrom, SCREEN.juryUnsealFrom + 8, [0, 1]);
  const gavelBob = Math.floor(frame / 8) % 2 === 0 ? 0 : -4;

  return (
    <CasePageShell>
      <div
        className="arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none"
        style={{ opacity: flicker, transform: `translateX(${shakeX}px)` }}
      >
        <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />

        <header className="relative shrink-0 border-b-4 border-arcade-border bg-black/80 px-3 py-2 text-center">
          <p
            className="font-arcade text-[7px] uppercase tracking-widest text-court-crimson"
            style={{ opacity: flashOn ? 1 : 0.35 }}
          >
            COURT IN RECESS — THE CROWD DECIDES FIRST
          </p>
          <p className="mt-1 break-words px-1 font-mono text-[10px] uppercase tracking-wide text-court-muted line-clamp-1">
            {CASE_META}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-3 py-3 text-center">
          {unsealing ? (
            <div
              className="flex flex-col items-center"
              style={{ opacity: unsealIn, transform: `scale(${0.9 + unsealIn * 0.1})` }}
            >
              <div style={{ transform: `translateY(${gavelBob}px)` }}>
                <RemotionPixelIcon asset="gavel" size={72} />
              </div>
              <p
                className="mt-3 font-arcade text-sm uppercase tracking-widest text-arcade-yellow"
                style={{ opacity: flashOn ? 1 : 0.4 }}
              >
                THE JUDGE ENTERS THE COURT
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase text-court-muted">
                UNSEALING THE VERDICT...
              </p>
            </div>
          ) : (
            <>
              <p className="font-arcade text-[8px] uppercase tracking-widest text-white">
                JURY DELIBERATING
              </p>
              <CountdownBox ms={remainingMs} />
              <p className="mt-3 max-w-md px-2 font-arcade text-[7px] leading-relaxed text-arcade-yellow uppercase tracking-wider">
                {variant === "owner"
                  ? "THE CROWD IS JUDGING YOUR BEEF."
                  : "YOU'VE PLACED YOUR BET."}{" "}
                THE JUDGE ENTERS THE COURT IN {formatCountdown(remainingMs)}.
              </p>
            </>
          )}

          <div className="mt-4 w-full max-w-md">
            {variant === "owner" ? (
              <CrowdHeatBarR jurors={0} pctA={0} pctB={0} />
            ) : (
              <CrowdHeatBarR
                jurors={DEMO_JURY.jurors}
                pctA={DEMO_JURY.pctA}
                pctB={DEMO_JURY.pctB}
                barsInAt={SCREEN.juryVoterFrom + 6}
              />
            )}
            {variant === "voter" && (
              <p className="mt-2 font-arcade text-[7px] uppercase tracking-widest text-court-muted">
                YOUR BET: <span className="text-arcade-blue">{DEMO_SIDE_A.name}</span>
              </p>
            )}
          </div>

          {variant === "owner" && (
            <div className="mt-4 w-full max-w-md">
              <p className="font-mono text-[9px] uppercase text-arcade-blue">
                &gt; JUDGE STATUS: {DEMO_DELIBERATION_LOGS[statusIndex]} ({statusProgress}%)
              </p>
            </div>
          )}
        </div>

        <footer className="relative shrink-0 border-t-4 border-arcade-border bg-black/40 px-3 py-1.5 text-center">
          <AiDisclosureText />
        </footer>
      </div>
    </CasePageShell>
  );
}

// ---- THE TRAP — pick-before-you-peek gate (STATE A in VerdictView) ----

function TrapSideCardR({
  side,
  enterAt,
  tapFrame,
}: {
  side: "A" | "B";
  enterAt: number;
  tapFrame?: number;
}) {
  const frame = useCurrentFrame();
  const isP1 = side === "A";
  const data = isP1 ? DEMO_SIDE_A : DEMO_SIDE_B;
  const frameVariant = isP1 ? "blue" : "pink";
  const accent = isP1 ? "text-arcade-blue" : "text-arcade-pink";
  const buttonClass = isP1 ? "bg-arcade-blue neon-glow-blue" : "bg-arcade-pink neon-glow-pink";

  const enter = clampFrame(frame, enterAt, enterAt + 10, [0, 1]);
  const press =
    tapFrame !== undefined
      ? interpolate(frame, [tapFrame - 1, tapFrame + 2, tapFrame + 10], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const counting = tapFrame !== undefined && frame >= tapFrame + 3;

  return (
    <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 12}px)` }}>
      <PixelFrame variant={frameVariant} className="flex h-full flex-col bg-black/80 p-2.5">
        <div className="flex items-center gap-2 border-b-2 border-arcade-border pb-1.5">
          <RemotionPixelIcon
            asset={isP1 ? "fighterP1" : "fighterP2"}
            size={36}
            className={isP1 ? "" : "-scale-x-100"}
          />
          <div className="min-w-0">
            <p className={`truncate font-arcade text-[9px] ${accent}`}>{data.name}</p>
            <p className="font-arcade text-[6px] uppercase text-court-muted">
              TEAM {side} · PLAYER {isP1 ? "1" : "2"}
            </p>
          </div>
        </div>

        {/* Blurred teaser — the argument stays sealed until you commit */}
        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden" aria-hidden>
          <p
            className="pointer-events-none select-none break-all font-mono text-[11px] leading-relaxed text-foreground/60 line-clamp-4"
            style={{ filter: "blur(6px)" }}
          >
            {data.argument.slice(0, 150)}
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="border-2 border-arcade-border bg-black/80 px-2 py-1 font-arcade text-[7px] uppercase tracking-widest text-court-muted">
              ARGUMENT SEALED
            </span>
          </div>
        </div>

        {/* The most tactile button in the app — a real coin-op slam */}
        <div
          className={`touch-target mt-3 w-full border-4 border-black px-3 py-3.5 text-center font-arcade text-[10px] uppercase tracking-wider text-black ${buttonClass}`}
          style={{
            borderBottomWidth: press > 0.4 ? 4 : 8,
            borderRightWidth: press > 0.4 ? 4 : 8,
            transform: `translateY(${press * 2}px) scale(${1 - press * 0.04})`,
          }}
        >
          {counting ? "COUNTING..." : `SIDE WITH ${data.name}`}
        </div>
      </PixelFrame>
    </div>
  );
}

/** THE TRAP — the friend's phone: arguments blurred, pick a side to unseal. */
export function TrapScreen() {
  const frame = useCurrentFrame();
  const flashOn = Math.floor(frame / 15) % 2 === 0;
  // JURY MODE badge blink (motion opacity [1, 0.55, 1] over 1s)
  const badgePulse = 1 - 0.45 * ((Math.sin((frame / 30) * Math.PI * 2) + 1) / 2);
  const flicker = 0.978 + 0.022 * (Math.floor(frame / 2) % 2);

  const elapsed = ((frame - SCREEN.trapFrom) / 30) * 1000;
  const remainingMs = DEMO_JURY.trapCountdownMs - elapsed;

  return (
    <CasePageShell
      overlay={
        // Tap lands on SIDE WITH TEAM PINEAPPLE (card A button)
        <TapIndicator x={196} y={388} tapFrame={SCREEN.trapTapSide} />
      }
    >
      <div
        className="arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none"
        style={{ opacity: flicker }}
      >
        <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />

        <header className="relative shrink-0 border-b-4 border-arcade-border bg-black/80 px-3 py-2 text-center">
          <p
            className="font-arcade text-[7px] uppercase tracking-widest text-court-crimson"
            style={{ opacity: flashOn ? 1 : 0.35 }}
          >
            ⚖ VERDICT SEALED ⚖
          </p>
          <h1 className="mt-1 break-words font-arcade text-sm leading-relaxed text-arcade-yellow uppercase tracking-wider">
            YOU HAVE BEEN SUMMONED
          </h1>
          <p className="mt-1 font-arcade text-[8px] leading-relaxed text-white uppercase tracking-wider">
            PICK A SIDE TO UNSEAL THE VERDICT.
          </p>
          <p className="mt-1 break-words px-1 font-mono text-[10px] uppercase tracking-wide text-court-muted line-clamp-1">
            {CASE_META}
          </p>
          <p
            className="mt-1.5 inline-block border-2 border-court-crimson bg-black px-2 py-1 font-arcade text-[7px] uppercase tracking-widest text-court-crimson"
            style={{ opacity: badgePulse }}
          >
            JURY MODE · JUDGE ENTERS IN {formatCountdown(remainingMs)}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden px-3 py-2.5">
          <div className="grid gap-2.5">
            <TrapSideCardR side="A" enterAt={SCREEN.trapFrom + 8} tapFrame={SCREEN.trapTapSide} />
            <TrapSideCardR side="B" enterAt={SCREEN.trapFrom + 12} />
          </div>

          <p className="mt-3 text-center font-arcade text-[7px] uppercase tracking-widest text-court-muted">
            {DEMO_JURY.preVoteJurors} JURORS HAVE PICKED · VOTES ARE FINAL · NO NEUTRAL GROUND
          </p>
          <p className="mt-1.5 text-center">
            <AiDisclosureText />
          </p>
        </div>
      </div>
    </CasePageShell>
  );
}
