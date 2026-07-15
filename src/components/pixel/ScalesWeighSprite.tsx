"use client";

interface ScalesWeighSpriteProps {
  size?: number;
  className?: string;
  /** Frames per second for the tip animation */
  fps?: number;
}

const FRAME_COUNT = 8;
const NATIVE_FRAME = 128;

/**
 * Sprite-sheet scales that tip center → right → center → left.
 * Sheet: /pixel/scales-weigh-sheet.png (8 × 96×96 horizontal frames)
 */
export function ScalesWeighSprite({
  size = 120,
  className = "",
  fps = 5,
}: ScalesWeighSpriteProps) {
  const duration = FRAME_COUNT / fps;

  return (
    <div
      role="img"
      aria-label="Justice scales weighing arguments"
      className={`pixel-art scales-weigh-sprite ${className}`.trim()}
      style={
        {
          width: size,
          height: size,
          ["--scales-frame" as string]: `${size}px`,
          backgroundImage: "url('/pixel/scales-weigh-sheet.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${size * FRAME_COUNT}px ${size}px`,
          imageRendering: "pixelated",
          animation: `scales-weigh-sheet ${duration}s steps(${FRAME_COUNT}) infinite`,
        } as React.CSSProperties
      }
    />
  );
}

export const SCALES_WEIGH_META = {
  frameWidth: NATIVE_FRAME,
  frameHeight: NATIVE_FRAME,
  frameCount: FRAME_COUNT,
} as const;
