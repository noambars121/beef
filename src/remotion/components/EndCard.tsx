import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ARCADE_FONT } from "../fonts";
import { CAPTIONS } from "../data/demoCase";
import { SCENES } from "../lib/timeline";

function outline(accent: string, o = 4): string {
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
  return `${dirs.map(([dx, dy]) => `${dx}px ${dy}px 0 #000`).join(", ")}, 0 0 30px ${accent}77, 0 0 60px ${accent}44`;
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
      config: { damping: 13, stiffness: 140 },
      durationInFrames: 22,
    });

  const titleIn = pop(0);
  const line1In = pop(10);
  const line2In = pop(18);
  const smallIn = interpolate(frame, [base + 26, base + 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
          top: 108,
          left: 0,
          right: 0,
          fontSize: 118,
          lineHeight: 1.2,
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
          opacity: Math.min(1, titleIn * 1.3),
          transform: `scale(${0.8 + titleIn * 0.2})`,
        }}
      >
        {CAPTIONS.endTitle}
      </div>

      <div
        style={{
          position: "absolute",
          top: 282,
          left: 0,
          right: 0,
          fontSize: 40,
          color: "#ffffff",
          letterSpacing: 2,
          textShadow: outline("#00f0ff"),
          opacity: Math.min(1, line1In * 1.3),
          transform: `translateY(${(1 - line1In) * 24}px)`,
        }}
      >
        {CAPTIONS.endLine1}
      </div>

      <div
        style={{
          position: "absolute",
          top: 352,
          left: 0,
          right: 0,
          fontSize: 40,
          color: "#ffe600",
          letterSpacing: 2,
          textShadow: outline("#ff007f"),
          opacity: Math.min(1, line2In * 1.3),
          transform: `translateY(${(1 - line2In) * 24}px)`,
        }}
      >
        {CAPTIONS.endLine2}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 0,
          right: 0,
          fontSize: 17,
          color: "rgba(208, 208, 220, 0.85)",
          letterSpacing: 3,
          textShadow: "0 3px 0 #000, 0 0 12px rgba(0,0,0,0.8)",
          opacity: smallIn,
        }}
      >
        {CAPTIONS.endSmall}
      </div>
    </div>
  );
}
