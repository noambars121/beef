import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ARCADE_FONT } from "../fonts";

interface CaptionOverlayProps {
  text: string;
  /** Absolute frames the caption is on screen. */
  from: number;
  to: number;
  position?: "top" | "bottom";
  accent?: string;
  fontSize?: number;
  /** Quick pop style for sub-second captions. */
  pop?: boolean;
  /** Distance from the top/bottom canvas edge. */
  edgeOffset?: number;
  /** Optional smaller second line under the main text. */
  subText?: string;
}

/** Thick 8-direction black outline + arcade glow — readable on phone + mobile feed. */
function outlineShadow(accent: string, weight = 5): string {
  const o = weight;
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
  const outline = dirs.map(([dx, dy]) => `${dx}px ${dy}px 0 #000`).join(", ");
  return `${outline}, 0 ${o + 5}px 0 #000, 0 0 28px ${accent}70, 0 0 56px ${accent}45`;
}

/**
 * Burned-in caption rendered OUTSIDE the phone, in the product's arcade type.
 * Sized for sound-off TikTok/Reels readability.
 */
export function CaptionOverlay({
  text,
  from,
  to,
  position = "top",
  accent = "#ffe600",
  fontSize = 52,
  pop = false,
  edgeOffset,
  subText,
}: CaptionOverlayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < from - 8 || frame > to + 8) return null;

  const enter = spring({
    frame: frame - from,
    fps,
    // Smooth settle — readable, not jumpy
    config: pop
      ? { damping: 16, stiffness: 160, mass: 0.85 }
      : { damping: 22, stiffness: 110, mass: 0.9 },
    durationInFrames: pop ? 18 : 26,
  });

  const exit = interpolate(frame, [to - 12, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const scale = 0.88 + enter * 0.12;
  const y = (1 - enter) * (position === "top" ? -28 : 28);
  const opacity = Math.min(enter * 1.25, 1) * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: edgeOffset ?? (position === "top" ? 72 : 88),
        display: "flex",
        justifyContent: "center",
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          padding: "0 28px",
          textAlign: "center",
          fontFamily: ARCADE_FONT,
          fontSize,
          lineHeight: 1.45,
          color: "#ffffff",
          letterSpacing: 1.5,
          textShadow: outlineShadow(accent, Math.max(5, Math.round(fontSize / 10))),
          transform: `translateY(${y}px) scale(${scale})`,
          opacity,
        }}
      >
        {text}
        {subText && (
          <div
            style={{
              marginTop: 14,
              fontSize: Math.round(fontSize * 0.62),
              lineHeight: 1.4,
              color: "#ffffff",
              letterSpacing: 1,
              textShadow: outlineShadow("#00f0ff", 4),
            }}
          >
            {subText}
          </div>
        )}
      </div>
    </div>
  );
}
