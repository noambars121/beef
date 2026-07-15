"""
Chroma-key raw arcade assets → transparent PNGs in public/pixel/.

Usage:
  python scripts/chroma_key_assets.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = Path(r"C:\Users\Noam\.cursor\projects\c-Dev-ActiveProjects-monard-judge\assets")
OUT_DIR = ROOT / "public" / "pixel"

# (raw_filename, output_filename, key_rgb, tolerance, max_size)
JOBS: list[tuple[str, str, tuple[int, int, int], int, int]] = [
    ("raw-coin.png", "pixel-coin.png", (255, 0, 255), 55, 128),
    ("raw-vs.png", "vs-badge.png", (255, 0, 255), 55, 160),
    ("raw-fighter-p1.png", "fighter-p1.png", (255, 0, 255), 55, 192),
    ("raw-fighter-p2.png", "fighter-p2.png", (0, 255, 255), 70, 192),  # cyan key (pink char)
    ("raw-scales.png", "pixel-scales.png", (255, 0, 255), 55, 128),
    ("raw-shock.png", "reaction-shock.png", (255, 0, 255), 55, 64),
    ("raw-laugh.png", "reaction-laugh.png", (255, 0, 255), 55, 64),
    ("raw-agree.png", "reaction-agree.png", (255, 0, 255), 55, 64),
    ("raw-ko.png", "ko-badge.png", (255, 0, 255), 55, 128),
    ("raw-gavel.png", "pixel-gavel.png", (255, 0, 255), 55, 96),
    ("raw-hall-banner.png", "hall-banner.png", (255, 0, 255), 55, 420),
    ("raw-rank1.png", "rank-1.png", (255, 0, 255), 55, 72),
    ("raw-rank2.png", "rank-2.png", (255, 0, 255), 55, 72),
    ("raw-rank3.png", "rank-3.png", (255, 0, 255), 55, 72),
    ("raw-shame-trophy.png", "shame-trophy.png", (255, 0, 255), 55, 128),
    ("raw-shame-skull.png", "shame-skull.png", (255, 0, 255), 55, 64),
    ("raw-btn-insert.png", "btn-insert-case.png", (255, 0, 255), 55, 320),
    ("raw-btn-hall.png", "btn-hall-shame.png", (255, 0, 255), 55, 320),
    ("raw-stat-players.png", "stat-players.png", (255, 0, 255), 55, 160),
    ("raw-stat-verdict.png", "stat-verdict.png", (255, 0, 255), 55, 160),
    ("raw-stat-mercy.png", "stat-mercy.png", (255, 0, 255), 55, 160),
]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def chroma_key(
    img: Image.Image,
    key: tuple[int, int, int],
    tolerance: int,
) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size

    soft = tolerance + 28

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = color_distance((r, g, b), key)
            if dist <= tolerance:
                pixels[x, y] = (0, 0, 0, 0)
            elif dist < soft:
                fade = int(255 * (dist - tolerance) / (soft - tolerance))
                # Despill: pull RGB away from key toward neutral gray
                kr, kg, kb = key
                nr = int(r + (128 - kr) * 0.35)
                ng = int(g + (128 - kg) * 0.35)
                nb = int(b + (128 - kb) * 0.35)
                pixels[x, y] = (
                    max(0, min(255, nr)),
                    max(0, min(255, ng)),
                    max(0, min(255, nb)),
                    min(a, fade),
                )

    return rgba


def trim_transparent(img: Image.Image, pad: int = 4) -> Image.Image:
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def downscale_pixel(img: Image.Image, max_size: int) -> Image.Image:
    w, h = img.size
    scale = min(max_size / w, max_size / h, 1.0)
    if scale >= 1.0:
        return img
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    return img.resize((nw, nh), Image.Resampling.NEAREST)


def sample_corner_key(img: Image.Image, fallback: tuple[int, int, int]) -> tuple[int, int, int]:
    """Use top-left corner as chroma key when it's a flat keyed plate."""
    rgb = img.convert("RGB")
    samples = [
        rgb.getpixel((2, 2)),
        rgb.getpixel((rgb.width - 3, 2)),
        rgb.getpixel((2, rgb.height - 3)),
        rgb.getpixel((rgb.width - 3, rgb.height - 3)),
    ]
    # Average corner colors — should match flat BG
    r = sum(p[0] for p in samples) // 4
    g = sum(p[1] for p in samples) // 4
    b = sum(p[2] for p in samples) // 4
    # If corners look near black/gray (failed key), keep fallback
    if max(r, g, b) < 40:
        return fallback
    return (r, g, b)


def process_one(
    raw_name: str,
    out_name: str,
    key: tuple[int, int, int],
    tolerance: int,
    max_size: int,
) -> None:
    src = RAW_DIR / raw_name
    if not src.exists():
        print(f"SKIP missing: {src}")
        return

    img = Image.open(src)
    sampled = sample_corner_key(img, key)
    keyed = chroma_key(img, sampled, tolerance)
    trimmed = trim_transparent(keyed)
    final = downscale_pixel(trimmed, max_size)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUT_DIR / out_name
    final.save(dest, "PNG", optimize=True)
    print(
        f"OK  {raw_name} -> {out_name}  {final.size[0]}x{final.size[1]}  "
        f"key={sampled} (fallback={key})"
    )


def main() -> None:
    for job in JOBS:
        process_one(*job)
    print(f"\nDone -> {OUT_DIR}")


if __name__ == "__main__":
    main()
