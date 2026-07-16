import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DURATION_IN_FRAMES, SCREEN } from "../lib/timeline";

/**
 * Cinematic backdrop behind the phone — story-synced, using the app's own
 * arena artworks (public/bg-*.jpg, the same set CourtroomBackground rotates
 * per route):
 *
 *   Act 1 · filing the case  -> golden gavel   (bg-insert-mobile.jpg)
 *   Act 2 · the court decides -> neon scales    (bg-verdict-mobile.jpg)
 *   Act 3 · eternal shame     -> broken trophy  (bg-hall-mobile.jpg)
 *
 * A soft blur + the app's darkening overlay stack keep it clearly behind the
 * device, and acts crossfade like the app's route transitions.
 */

const ACT_FADE = 18;

const ACTS = [
  { src: "/bg-insert-mobile.jpg", from: 0, to: SCREEN.juryOwnerFrom },
  { src: "/bg-verdict-mobile.jpg", from: SCREEN.juryOwnerFrom, to: SCREEN.hallFrom },
  { src: "/bg-hall-mobile.jpg", from: SCREEN.hallFrom, to: DURATION_IN_FRAMES },
] as const;

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

export function StageBackground() {
  const frame = useCurrentFrame();

  const drift = interpolate(frame, [0, DURATION_IN_FRAMES], [1.16, 1.3]);
  const sway = Math.sin((frame / DURATION_IN_FRAMES) * Math.PI * 2) * 12;

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
      {ACTS.map(({ src, from, to }) => {
        const opacity = actOpacity(frame, from, to);
        if (opacity <= 0) return null;
        return (
          <Img
            key={src}
            src={staticFile(src)}
            alt=""
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 30%",
              transform: `translate(-50%, -50%) translateX(${sway}px) scale(${drift})`,
              filter: "saturate(1.08) blur(2.5px) brightness(0.92)",
              opacity,
            }}
          />
        );
      })}

      {/* Same overlay stack as CourtroomBackground.tsx */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.56), rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
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
            "radial-gradient(circle at 50% 30%, transparent 0%, rgba(0,0,0,0.26) 55%, rgba(0,0,0,0.64) 100%)",
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
