import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const FRAME_COUNT = 8;

/**
 * Frame-driven adapter for src/components/pixel/ScalesWeighSprite.tsx.
 * The production sprite animates via a CSS steps() animation, which does not
 * advance deterministically with Remotion's timeline — so the same sheet is
 * stepped manually from useCurrentFrame() at the same 5fps cadence.
 */
export function RemotionScales({
  size = 128,
  spriteFps = 5,
  className = "",
}: {
  size?: number;
  spriteFps?: number;
  className?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spriteFrame =
    Math.floor((frame / fps) * spriteFps) % FRAME_COUNT;

  return (
    <div
      role="img"
      aria-label="Justice scales weighing arguments"
      className={`pixel-art scales-weigh-sprite ${className}`.trim()}
      style={{
        width: size,
        height: size,
        backgroundImage: `url('${staticFile("/pixel/scales-weigh-sheet.png")}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${size * FRAME_COUNT}px ${size}px`,
        backgroundPosition: `${-spriteFrame * size}px 0`,
        imageRendering: "pixelated",
      }}
    />
  );
}
