import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ARCADE_FONT } from "../fonts";
import { CAPTIONS } from "../data/demoCase";
import { SCENES } from "../lib/timeline";

function outline(accent: string, o = 5): string {
  const dirs = [
    [o, 0],
    [-o, 0],
    [0, o],
    [0, -o],
    [o, o],
    [o, -o],
    [-o, o],
    [-o, -o],
  ];
  return `${dirs.map(([dx, dy]) => `${dx}px ${dy}px 0 #000`).join(", ")}, 0 0 32px ${accent}77, 0 0 64px ${accent}44`;
}

/** External end-card copy around the floating phone (scene 7). */
export function EndCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = SCENES.end.from + 8;
  if (frame < base - 4) return null;

  const pop = (delay: number) =>
    spring({
      frame: frame - (base + delay),
      fps,
      config: { damping: 20, stiffness: 120, mass: 0.9 },
      durationInFrames: 26,
    });

  const titleIn = pop(0);
  const line1In = pop(10);
  const line2In = pop(18);
  const smallIn = interpolate(frame, [base + 26, base + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Final neon pulse
  const pulse = (Math.sin((frame - base) / 9) + 1) / 2;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        pointerEvents: "none",
        fontFamily: ARCADE_FONT,
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 96,
          left: 0,
          right: 0,
          fontSize: 128,
          lineHeight: 1.15,
          background:
            "linear-gradient(180deg, #ffffff 0%, #ffe600 40%, #ff8000 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: [
            "drop-shadow(0 6px 0 #000)",
            `drop-shadow(0 0 ${18 + pulse * 22}px rgba(255,230,0,${0.5 + pulse * 0.4}))`,
            `drop-shadow(0 0 ${40 + pulse * 30}px rgba(255,0,127,${0.3 + pulse * 0.25}))`,
          ].join(" "),
          opacity: Math.min(1, titleIn * 1.25),
          transform: `scale(${0.86 + titleIn * 0.14})`,
        }}
      >
        {CAPTIONS.endTitle}
      </div>

      <div
        style={{
          position: "absolute",
          top: 268,
          left: 0,
          right: 0,
          padding: "0 24px",
          fontSize: 48,
          lineHeight: 1.35,
          color: "#ffffff",
          letterSpacing: 2,
          textShadow: outline("#00f0ff"),
          opacity: Math.min(1, line1In * 1.25),
          transform: `translateY(${(1 - line1In) * 20}px)`,
        }}
      >
        {CAPTIONS.endLine1}
      </div>

      <div
        style={{
          position: "absolute",
          top: 348,
          left: 0,
          right: 0,
          padding: "0 24px",
          fontSize: 48,
          lineHeight: 1.35,
          color: "#ffe600",
          letterSpacing: 2,
          textShadow: outline("#ff007f"),
          opacity: Math.min(1, line2In * 1.25),
          transform: `translateY(${(1 - line2In) * 20}px)`,
        }}
      >
        {CAPTIONS.endLine2}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 56,
          left: 0,
          right: 0,
          padding: "0 32px",
          fontSize: 22,
          lineHeight: 1.4,
          color: "rgba(208, 208, 220, 0.9)",
          letterSpacing: 2.5,
          textShadow: "0 3px 0 #000, 0 0 14px rgba(0,0,0,0.8)",
          opacity: smallIn,
        }}
      >
        {CAPTIONS.endSmall}
      </div>
    </div>
  );
}
