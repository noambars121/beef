"""
Chroma-key home CTA/stat assets and force matching sizes.
Buttons → identical wide size, stats → identical square size.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(r"C:\Users\Noam\.cursor\projects\c-Dev-ActiveProjects-monard-judge\assets")
OUT = ROOT / "public" / "pixel"

BUTTON_SIZE = (320, 96)  # identical for both CTAs
STAT_SIZE = (140, 140)  # identical for all three stats

JOBS = [
    ("raw-btn-insert-v4.png", "btn-insert-case.png", BUTTON_SIZE),
    ("raw-btn-hall-v3.png", "btn-hall-shame.png", BUTTON_SIZE),
    ("raw-stat-players-v2.png", "stat-players.png", STAT_SIZE),
    ("raw-stat-verdict-v2.png", "stat-verdict.png", STAT_SIZE),
    ("raw-stat-mercy-v2.png", "stat-mercy.png", STAT_SIZE),
]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def sample_key(img: Image.Image) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    pts = [
        rgb.getpixel((4, 4)),
        rgb.getpixel((rgb.width - 5, 4)),
        rgb.getpixel((4, rgb.height - 5)),
        rgb.getpixel((rgb.width - 5, rgb.height - 5)),
    ]
    return tuple(sum(p[i] for p in pts) // 4 for i in range(3))  # type: ignore


def chroma_key(img: Image.Image, key: tuple[int, int, int], tolerance: int = 55) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    soft = tolerance + 28
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dist = color_distance((r, g, b), key)
            if dist <= tolerance:
                px[x, y] = (0, 0, 0, 0)
            elif dist < soft:
                fade = int(255 * (dist - tolerance) / (soft - tolerance))
                px[x, y] = (r, g, b, min(a, fade))
    return rgba


def trim(img: Image.Image, pad: int = 4) -> Image.Image:
    bbox = img.split()[-1].getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop(
        (
            max(0, l - pad),
            max(0, t - pad),
            min(img.width, r + pad),
            min(img.height, b + pad),
        )
    )


def fit_exact(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Scale to fit inside size, then center on transparent canvas of exact size."""
    tw, th = size
    img = img.copy()
    img.thumbnail((tw, th), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (tw - img.width) // 2
    y = (th - img.height) // 2
    canvas.paste(img, (x, y), img)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for raw_name, out_name, size in JOBS:
        src = RAW / raw_name
        if not src.exists():
            print(f"SKIP missing {src}")
            continue
        keyed = chroma_key(Image.open(src), sample_key(Image.open(src)))
        final = fit_exact(trim(keyed), size)
        dest = OUT / out_name
        final.save(dest, "PNG", optimize=True)
        print(f"OK {raw_name} -> {out_name} {final.size}")


if __name__ == "__main__":
    main()
