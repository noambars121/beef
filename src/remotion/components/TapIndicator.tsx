import { interpolate, useCurrentFrame } from "remotion";

interface TapIndicatorProps {
  /** Logical screen coords of the tap center. */
  x: number;
  y: number;
  /** Absolute composition frame of finger contact. */
  tapFrame: number;
}

/**
 * Clean mobile tap indicator: a soft fingertip disc glides in, presses, and a
 * neon ripple bursts on contact. Entirely frame-driven.
 */
export function TapIndicator({ x, y, tapFrame }: TapIndicatorProps) {
  const frame = useCurrentFrame();
  const appear = tapFrame - 14;
  const leave = tapFrame + 18;

  if (frame < appear || frame > leave) return null;

  // Fingertip disc approach: drifts up-left into position, presses on contact.
  const approach = interpolate(frame, [appear, tapFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const discOpacity = interpolate(
    frame,
    [appear, appear + 6, tapFrame + 6, leave],
    [0, 0.85, 0.85, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const press = interpolate(frame, [tapFrame - 2, tapFrame + 2, tapFrame + 8], [1, 0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ripple ring on contact
  const rippleT = interpolate(frame, [tapFrame, tapFrame + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleScale = 0.35 + rippleT * 1.5;
  const rippleOpacity = frame >= tapFrame ? 0.9 * (1 - rippleT) : 0;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      {/* ripple */}
      <div
        style={{
          position: "absolute",
          left: -28,
          top: -28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "3px solid rgba(255, 230, 0, 0.95)",
          boxShadow:
            "0 0 14px rgba(255,230,0,0.5), inset 0 0 10px rgba(255,230,0,0.3)",
          transform: `scale(${rippleScale})`,
          opacity: rippleOpacity,
        }}
      />
      {/* fingertip disc */}
      <div
        style={{
          position: "absolute",
          left: -21,
          top: -21,
          width: 42,
          height: 42,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.18) 100%)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.45), 0 0 18px rgba(255,255,255,0.25)",
          opacity: discOpacity,
          transform: `translate(${approach * 46}px, ${approach * 60}px) scale(${press})`,
        }}
      />
    </div>
  );
}
