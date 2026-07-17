import { interpolate, useCurrentFrame } from "remotion";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import { RemotionPixelIcon } from "../components/RemotionPixelIcon";
import { ScreenBackground } from "../components/StageBackground";
import { AppChrome } from "../components/AppChrome";
import { TapIndicator } from "../components/TapIndicator";
import { SCREEN_H, SCREEN_W } from "../components/IPhone17Frame";

const MONAD_PURPLE = "#836EF9";

interface HomeScreenProps {
  /** Absolute frame of the CTA tap (Infinity for the end-card home). */
  tapFrame?: number;
}

/**
 * 1:1 adaptation of src/app/page.tsx (mobile branch).
 * Layout, classes and copy match the real home page; the CSS keyframe
 * animations (text-flash, beef-title-fx, beef-sub-fx) are re-driven from
 * useCurrentFrame() so every render is deterministic.
 */
export function HomeScreen({ tapFrame }: HomeScreenProps) {
  const frame = useCurrentFrame();

  // .text-flash — 1s step-end blink
  const flashOn = Math.floor(frame / 15) % 2 === 0;

  // .beef-title-fx — glow (2.4s) + bob (3.2s)
  const glowT = (Math.sin((frame / 72) * Math.PI * 2) + 1) / 2;
  const bobY = Math.sin((frame / 96) * Math.PI * 2) * -2;
  const titleFilter = [
    "drop-shadow(0 4px 0 #000)",
    `drop-shadow(0 0 ${10 + glowT * 12}px rgba(255, 230, 0, ${0.4 + glowT * 0.45}))`,
    `drop-shadow(0 0 ${22 + glowT * 18}px rgba(255, ${Math.round(128 - glowT * 128)}, ${Math.round(glowT * 127)}, ${0.25 + glowT * 0.2}))`,
  ].join(" ");

  // .beef-sub-fx — 4s shimmer sweep
  const shimmerPos = 100 - ((frame % 120) / 120) * 200;

  // CTA press feedback
  const pressT =
    tapFrame !== undefined
      ? interpolate(frame, [tapFrame - 1, tapFrame + 2, tapFrame + 8], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: SCREEN_W, height: SCREEN_H }}
    >
      <ScreenBackground route="home" />
      <AppChrome />

      <main
        className="page-shell-home relative z-10 flex h-full flex-col items-center justify-center text-center"
        style={{ paddingTop: 54 }}
      >
        <p
          className="font-arcade text-[9px] uppercase tracking-[0.25em] text-arcade-pink"
          style={{ opacity: flashOn ? 1 : 0 }}
        >
          INSERT BEEF TO START
        </p>

        <h1
          className="mt-2 font-arcade text-[2.75rem] leading-snug arcade-gradient-text"
          style={{ filter: titleFilter, transform: `translateY(${bobY}px)` }}
        >
          BEEF
        </h1>

        <p
          className="mt-2 px-2 font-mono text-[0.95rem] font-bold uppercase leading-snug tracking-wide"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #ffffff 0%, #ffe600 35%, #ffffff 50%, #ff007f 65%, #ffffff 100%)",
            backgroundSize: "220% 100%",
            backgroundPosition: `${shimmerPos}% 50%`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 ${4 + glowT * 6}px rgba(0, 240, 255, ${0.25 + glowT * 0.2}))`,
          }}
        >
          Don&apos;t just win the argument.
          <br /> Destroy their ego
        </p>

        {/* Matching CTA buttons — same display size as page.tsx mobile */}
        <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-2.5 px-2">
          <div
            className="touch-target block"
            style={{
              transform: `translateY(${pressT * 3}px) scale(${1 - pressT * 0.04})`,
              filter: pressT > 0 ? `brightness(${1 + pressT * 0.25})` : undefined,
            }}
          >
            <RemotionPixelIcon
              asset="btnInsert"
              size={240}
              height={72}
              alt="CALL THE JUDGE"
              className="h-auto w-[240px] drop-shadow-[0_4px_0_#000]"
            />
          </div>
          <div className="touch-target block">
            <RemotionPixelIcon
              asset="btnHall"
              size={240}
              height={72}
              alt="HALL OF SHAME"
              className="h-auto w-[240px] drop-shadow-[0_4px_0_#000]"
            />
          </div>
        </div>

        <p className="mt-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-court-muted">
          FOR PETTY DEBATES.{" "}
          <span className="text-arcade-blue underline decoration-arcade-blue/40 underline-offset-4">
            NOT SERIOUS DISPUTES.
          </span>
        </p>

        <p
          className="mt-2 inline-flex max-w-[min(100%,22rem)] items-center gap-1.5 border-2 bg-black/70 px-2.5 py-1 font-arcade text-[6px] uppercase leading-snug tracking-widest"
          style={{
            borderColor: MONAD_PURPLE,
            color: MONAD_PURPLE,
            boxShadow: `0 0 12px ${MONAD_PURPLE}55`,
          }}
        >
          ⛓ EVERY VERDICT SEALED ON MONAD — TAMPER-PROOF COURT RECORD
        </p>

        {/* Matching stat tiles — same square size as page.tsx mobile */}
        <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2 px-2">
          {(
            [
              { asset: "statPlayers" as const, label: "2P Players" },
              { asset: "statVerdict" as const, label: "1 Verdict" },
              { asset: "statMercy" as const, label: "00 Mercy" },
            ] as const
          ).map((item) => (
            <div key={item.asset} className="flex justify-center">
              <RemotionPixelIcon
                asset={item.asset}
                size={72}
                alt={item.label}
                className="h-auto w-full max-w-[72px] drop-shadow-[0_4px_0_#000]"
              />
            </div>
          ))}
        </div>

        <p className="mt-2.5">
          <BuilderCredit />
        </p>
      </main>

      {tapFrame !== undefined && (
        // Tap lands on the CALL THE JUDGE button (upper CTA)
        <TapIndicator x={SCREEN_W / 2 + 6} y={348} tapFrame={tapFrame} />
      )}
    </div>
  );
}
