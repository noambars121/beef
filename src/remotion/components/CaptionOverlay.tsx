import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
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
}

/** 8-direction black outline + arcade glow, readable with sound off. */
function outlineShadow(accent: string): string {
  const o = 4;
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
  return `${outline}, 0 ${o + 4}px 0 #000, 0 0 26px ${accent}66, 0 0 52px ${accent}40`;
}

/**
 * Burned-in caption rendered OUTSIDE the phone, in the product's arcade type.
 */
export function CaptionOverlay({
  text,
  from,
  to,
  position = "top",
  accent = "#ffe600",
  fontSize = 46,
  pop = false,
  edgeOffset,
}: CaptionOverlayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < from - 5 || frame > to + 5) return null;

  const enter = spring({
    frame: frame - from,
    fps,
    config: pop ? { damping: 11, stiffness: 190 } : { damping: 14, stiffness: 130 },
    durationInFrames: 22,
  });

  const exit = interpolate(frame, [to - 8, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = 0.82 + enter * 0.18;
  const y = (1 - enter) * (position === "top" ? -34 : 34);
  const opacity = Math.min(enter * 1.4, 1) * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: edgeOffset ?? (position === "top" ? 108 : 96),
        display: "flex",
        justifyContent: "center",
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          padding: "0 40px",
          textAlign: "center",
          fontFamily: ARCADE_FONT,
          fontSize,
          lineHeight: 1.6,
          color: "#ffffff",
          letterSpacing: 1,
          textShadow: outlineShadow(accent),
          transform: `translateY(${y}px) scale(${scale})`,
          opacity,
        }}
      >
        {text}
      </div>
    </div>
  );
}
