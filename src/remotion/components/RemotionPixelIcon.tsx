import { Img, staticFile } from "remotion";
import type { PixelAsset } from "@/components/pixel/PixelIcon";

/**
 * Video adapter for src/components/pixel/PixelIcon.tsx.
 *
 * The production component renders through next/image, which lazy-loads and
 * cannot guarantee the sprite is decoded before Remotion captures a frame.
 * Remotion's <Img> blocks rendering until the asset is ready, so this adapter
 * swaps only the img element. The asset map mirrors PIXEL_ASSETS 1:1 and is
 * type-checked against the real component's PixelAsset union, so a renamed or
 * added sprite fails the typecheck here instead of silently drifting.
 */
const ASSETS: Record<PixelAsset, string> = {
  coin: "/pixel/pixel-coin.png",
  scales: "/pixel/pixel-scales.png",
  gavel: "/pixel/pixel-gavel.png",
  fighterP1: "/pixel/fighter-p1.png",
  fighterP2: "/pixel/fighter-p2.png",
  vs: "/pixel/vs-badge.png",
  ko: "/pixel/ko-badge.png",
  shock: "/pixel/reaction-shock.png",
  laugh: "/pixel/reaction-laugh.png",
  agree: "/pixel/reaction-agree.png",
  hallBanner: "/pixel/hall-banner.png",
  rank1: "/pixel/rank-1.png",
  rank2: "/pixel/rank-2.png",
  rank3: "/pixel/rank-3.png",
  shameTrophy: "/pixel/shame-trophy.png",
  shameSkull: "/pixel/shame-skull.png",
  btnInsert: "/pixel/btn-call-the-judge.png",
  btnHall: "/pixel/btn-hall-shame-v3.png",
  statPlayers: "/pixel/stat-players-v2.png",
  statVerdict: "/pixel/stat-verdict.png",
  statMercy: "/pixel/stat-mercy.png",
};

interface RemotionPixelIconProps {
  asset: PixelAsset;
  size?: number;
  /** Optional explicit height for wide assets (buttons). Defaults to size. */
  height?: number;
  className?: string;
  alt?: string;
}

export function RemotionPixelIcon({
  asset,
  size = 32,
  height,
  className = "",
  alt = "",
}: RemotionPixelIconProps) {
  const h = height ?? size;
  const isWide = h !== size;
  return (
    <Img
      src={staticFile(ASSETS[asset])}
      alt={alt}
      className={`pixel-art shrink-0 ${className}`}
      style={{
        width: size,
        height: isWide ? h : "auto",
        imageRendering: "pixelated",
      }}
    />
  );
}
