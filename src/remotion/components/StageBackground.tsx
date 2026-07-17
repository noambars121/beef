import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DURATION_IN_FRAMES, SCREEN } from "../lib/timeline";

/**
 * Cinematic STAGE behind the phone — not the in-app artwork.
 * Dark court / product-demo look: soft light pools, Monad purple, arcade
 * cyan/pink accents, subtle floor reflection. Acts shift the accent mood
 * without recycling the app's bg-*.jpg assets.
 */

const ACT_FADE = 22;

type ActMood = {
  from: number;
  to: number;
  /** Primary wash color (rgba) */
  wash: string;
  /** Secondary rim light */
  rim: string;
  /** Spotlight under the phone */
  spot: string;
};

const MOODS: ActMood[] = [
  {
    // Filing the case — warm gold court
    from: 0,
    to: SCREEN.juryOwnerFrom,
    wash: "rgba(255, 180, 40, 0.14)",
    rim: "rgba(255, 230, 0, 0.1)",
    spot: "rgba(255, 200, 60, 0.22)",
  },
  {
    // Jury / trap / verdict — crimson + cyan clash
    from: SCREEN.juryOwnerFrom,
    to: SCREEN.hallFrom,
    wash: "rgba(255, 0, 90, 0.12)",
    rim: "rgba(0, 240, 255, 0.1)",
    spot: "rgba(131, 110, 249, 0.28)",
  },
  {
    // Hall of Shame — neon pink heat
    from: SCREEN.hallFrom,
    to: DURATION_IN_FRAMES,
    wash: "rgba(255, 0, 127, 0.14)",
    rim: "rgba(255, 230, 0, 0.08)",
    spot: "rgba(255, 0, 127, 0.2)",
  },
];

function actOpacity(frame: number, from: number, to: number): number {
  const fadeIn =
    from === 0
      ? 1
      : interpolate(frame, [from - ACT_FADE / 2, from + ACT_FADE / 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const fadeOut =
    to === DURATION_IN_FRAMES
      ? 1
      : interpolate(frame, [to - ACT_FADE / 2, to + ACT_FADE / 2], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return Math.min(fadeIn, fadeOut);
}

/** Soft floating orb for depth (frame-driven, no CSS animation). */
function Orb({
  x,
  y,
  size,
  color,
  frame,
  speed,
}: {
  x: string;
  y: string;
  size: number;
  color: string;
  frame: number;
  speed: number;
}) {
  const driftY = Math.sin(frame * speed) * 18;
  const driftX = Math.cos(frame * speed * 0.7) * 10;
  const pulse = 0.55 + 0.45 * ((Math.sin(frame * speed * 1.3) + 1) / 2);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        transform: `translate(${driftX}px, ${driftY}px)`,
        opacity: pulse * 0.85,
        filter: "blur(2px)",
        pointerEvents: "none",
      }}
    />
  );
}

export function StageBackground() {
  const frame = useCurrentFrame();

  // Slow ambient breathe
  const breathe = 0.92 + 0.08 * ((Math.sin(frame / 90) + 1) / 2);
  const floorPulse = 0.35 + 0.15 * ((Math.sin(frame / 70) + 1) / 2);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#04040a",
      }}
    >
      {/* Deep vertical base */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #0a0a14 0%, #06060c 42%, #030308 72%, #010104 100%)",
        }}
      />

      {/* Subtle perspective floor grid */}
      <div
        style={{
          position: "absolute",
          left: "-20%",
          right: "-20%",
          bottom: "-8%",
          height: "48%",
          backgroundImage: `
            linear-gradient(90deg, rgba(131,110,249,0.07) 1px, transparent 1px),
            linear-gradient(0deg, rgba(0,240,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          transform: "perspective(900px) rotateX(68deg)",
          transformOrigin: "center top",
          opacity: 0.55 * breathe,
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
        }}
      />

      {/* Floor reflection pool under the phone */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "6%",
          width: 720,
          height: 220,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(131,110,249,0.35) 0%, rgba(0,240,255,0.08) 40%, transparent 70%)",
          opacity: floorPulse,
          filter: "blur(8px)",
        }}
      />

      {/* Act mood washes */}
      {MOODS.map((mood) => {
        const opacity = actOpacity(frame, mood.from, mood.to);
        if (opacity <= 0) return null;
        return (
          <div key={`${mood.from}-${mood.to}`} style={{ opacity }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse 90% 55% at 50% 18%, ${mood.wash} 0%, transparent 65%)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse 70% 40% at 50% 72%, ${mood.spot} 0%, transparent 60%)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, ${mood.rim}, transparent 28%, transparent 72%, ${mood.rim})`,
              }}
            />
          </div>
        );
      })}

      {/* Floating light orbs — product-demo depth */}
      <Orb x="8%" y="18%" size={280} color="rgba(131,110,249,0.45)" frame={frame} speed={0.018} />
      <Orb x="72%" y="12%" size={220} color="rgba(0,240,255,0.35)" frame={frame} speed={0.022} />
      <Orb x="14%" y="58%" size={180} color="rgba(255,0,127,0.28)" frame={frame} speed={0.015} />
      <Orb x="78%" y="62%" size={200} color="rgba(255,230,0,0.2)" frame={frame} speed={0.02} />

      {/* Center key light behind the phone */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "38%",
          width: 520,
          height: 720,
          transform: `translate(-50%, -50%) scale(${breathe})`,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(131,110,249,0.12) 35%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Soft vignette — keeps captions readable, phone in focus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 75% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* Top/bottom film bars for vertical polish */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Ultra-subtle grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}

const SCREEN_BG: Record<"home" | "wizard" | "case" | "hall", string> = {
  home: "/cyber-judge-bg.png",
  wizard: "/bg-insert-mobile.jpg",
  case: "/bg-verdict-mobile.jpg",
  hall: "/bg-hall-mobile.jpg",
};

/**
 * In-phone page background — adapted from CourtroomBackground.tsx (which uses
 * framer-motion crossfades + usePathname). Same mobile artwork per route and
 * the exact same overlay gradient stack, statically rendered per screen.
 */
export function ScreenBackground({ route }: { route: "home" | "wizard" | "case" | "hall" }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#050508",
        zIndex: 0,
      }}
    >
      <Img
        src={staticFile(SCREEN_BG[route])}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 12%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(255,0,127,0.08), transparent, rgba(0,240,255,0.08))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 28%, transparent 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0.12) 6px)",
        }}
      />
    </div>
  );
}
