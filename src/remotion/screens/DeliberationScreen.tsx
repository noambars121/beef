import { interpolate, useCurrentFrame } from "remotion";
import { DEMO_CASE, DEMO_DELIBERATION_LOGS } from "../data/demoCase";
import { SCREEN } from "../lib/timeline";
import { RemotionScales } from "../components/RemotionScales";
import { ScreenBackground } from "../components/StageBackground";
import { AppChrome } from "../components/AppChrome";
import { SCREEN_H, SCREEN_W } from "../components/IPhone17Frame";

/**
 * 1:1 adaptation of the deliberating state in VerdictView.tsx (plus the real
 * case-page wrapper from src/app/case/[id]/page.tsx). The CSS crt-flicker and
 * the framer-motion log/progress animations are re-driven from frames.
 */
export function DeliberationScreen() {
  const frame = useCurrentFrame();
  const local = frame - SCREEN.deliberationFrom;
  const total = SCREEN.deliberationTo - SCREEN.deliberationFrom;

  // Cycling terminal logs (~0.87s per line, like the real 2s cadence sped up
  // for the edit) with the original pop in/out easing.
  const logDuration = Math.floor(total / DEMO_DELIBERATION_LOGS.length);
  const logIndex = Math.min(
    DEMO_DELIBERATION_LOGS.length - 1,
    Math.floor(local / logDuration)
  );
  const logLocal = local - logIndex * logDuration;
  const logIn = interpolate(logLocal, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logOut = interpolate(logLocal, [logDuration - 4, logDuration - 1], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logOpacity = Math.min(logIn, logOut);
  const logScale = 0.9 + Math.min(logIn, logOut) * 0.1;

  // Retro loading bar sweep
  const barWidth = interpolate(local, [0, total], [4, 96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CRT flicker (subtle) + tension shake ramping toward the verdict
  const flicker = 0.975 + 0.025 * (Math.floor(frame / 2) % 2);
  const tension = interpolate(local, [total - 36, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 2.61) * tension * 2.6;
  const shakeY = Math.cos(frame * 3.17) * tension * 2.2;

  // "WEIGHING ARGUMENTS" text-flash
  const flashOn = Math.floor(frame / 15) % 2 === 0;

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
            <div
              className="arcade-panel arcade-screen relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-none p-4 text-center"
              style={{
                opacity: flicker,
                transform: `translate(${shakeX}px, ${shakeY}px)`,
              }}
            >
              <div className="arcade-grid absolute inset-0 -z-10 opacity-30" />

              {/* Weighing scales sprite sheet — tips R / center / L */}
              <div className="relative mx-auto flex flex-col items-center">
                <RemotionScales size={128} spriteFps={5} />
                <p
                  className="mt-1 font-arcade text-[7px] uppercase tracking-widest text-arcade-yellow/80"
                  style={{ opacity: flashOn ? 1 : 0 }}
                >
                  WEIGHING ARGUMENTS
                </p>
              </div>

              <h1 className="mt-4 font-arcade text-xs tracking-wider text-arcade-yellow">
                JUDGE DELIBERATING...
              </h1>
              <p className="mx-auto mt-2 break-words border-b-4 border-double border-arcade-border px-1 pb-3 font-mono text-[10px] uppercase text-court-muted">
                {DEMO_CASE.title}
              </p>

              {/* Cycling deliberation logs */}
              <div className="mt-4 flex h-8 items-center justify-center">
                <p
                  className="font-arcade text-[10px] text-arcade-blue"
                  style={{ opacity: logOpacity, transform: `scale(${logScale})` }}
                >
                  &gt; {DEMO_DELIBERATION_LOGS[logIndex]}
                </p>
              </div>

              {/* Retro arcade loading bar */}
              <div className="mx-auto mt-3 h-5 w-full max-w-xs border-4 border-arcade-border bg-black p-0.5">
                <div className="h-full bg-arcade-pink" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
