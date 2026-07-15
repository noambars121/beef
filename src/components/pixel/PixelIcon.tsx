import Image from "next/image";

const ASSETS = {
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
} as const;

export type PixelAsset = keyof typeof ASSETS;

interface PixelIconProps {
  asset: PixelAsset;
  size?: number;
  /** Optional explicit height for wide assets (buttons). Defaults to size. */
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function PixelIcon({
  asset,
  size = 32,
  height,
  className = "",
  alt = "",
  priority = false,
}: PixelIconProps) {
  const h = height ?? size;
  const isWide = h !== size;
  return (
    <Image
      src={ASSETS[asset]}
      alt={alt}
      width={size}
      height={h}
      priority={priority}
      unoptimized
      className={`pixel-art shrink-0 ${className}`}
      style={{
        width: size,
        height: isWide ? h : "auto",
        imageRendering: "pixelated",
      }}
    />
  );
}

export { ASSETS as PIXEL_ASSETS };
