import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DURATION_IN_FRAMES } from "../lib/timeline";

/**
 * Cinematic backdrop behind the phone: the app's own cyber-courtroom artwork
 * (public/cyber-judge-bg.png) with the same darkening overlay stack the real
 * CourtroomBackground applies, plus a slow deterministic drift for life.
 */
export function StageBackground() {
  const frame = useCurrentFrame();

  const drift = interpolate(frame, [0, DURATION_IN_FRAMES], [1.12, 1.22]);
  const sway = Math.sin((frame / DURATION_IN_FRAMES) * Math.PI * 2) * 14;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#050508",
      }}
    >
      <Img
        src={staticFile("/cyber-judge-bg.png")}
        alt=""
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(-50%, -50%) translateX(${sway}px) scale(${drift})`,
          filter: "saturate(1.05)",
        }}
      />

      {/* Same overlay stack as CourtroomBackground.tsx */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.58), rgba(0,0,0,0.42), rgba(0,0,0,0.62))",
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
            "radial-gradient(circle at 50% 28%, transparent 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.66) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(255,255,255,0.12) 5px, rgba(255,255,255,0.12) 10px)",
        }}
      />
    </div>
  );
}

const SCREEN_BG: Record<"home" | "wizard" | "case", string> = {
  home: "/cyber-judge-bg.png",
  wizard: "/bg-insert-mobile.jpg",
  case: "/bg-verdict-mobile.jpg",
};

/**
 * In-phone page background — adapted from CourtroomBackground.tsx (which uses
 * framer-motion crossfades + usePathname). Same mobile artwork per route and
 * the exact same overlay gradient stack, statically rendered per screen.
 */
export function ScreenBackground({ route }: { route: "home" | "wizard" | "case" }) {
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
            "radial-gradient(circle at 50% 28%, transparent 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.55) 100%)",
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
