"""
Chroma-key generated scales frames and stitch into a horizontal sprite sheet.
Sequence: center -> right -> heavy right -> right -> center -> left -> heavy left -> left
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(r"C:\Users\Noam\.cursor\projects\c-Dev-ActiveProjects-monard-judge\assets")
OUT = ROOT / "public" / "pixel" / "scales-weigh-sheet.png"

FRAME_SIZE = 128

# Animation order for weigh loop
FRAMES = [
    "raw-scales-f1.png",           # center
    "raw-scales-f4.png",           # slight right
    "raw-scales-f7-right.png",     # heavy right (ref-guided)
    "raw-scales-f8-right-slight.png",  # return right
    "raw-scales-f1.png",           # center
    "raw-scales-f2.png",           # slight left
    "raw-scales-f3.png",           # heavy left
    "raw-scales-f2.png",           # return left
]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def sample_key(img: Image.Image) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    samples = [
        rgb.getpixel((4, 4)),
        rgb.getpixel((rgb.width - 5, 4)),
        rgb.getpixel((4, rgb.height - 5)),
        rgb.getpixel((rgb.width - 5, rgb.height - 5)),
    ]
    return (
        sum(p[0] for p in samples) // 4,
        sum(p[1] for p in samples) // 4,
        sum(p[2] for p in samples) // 4,
    )


def chroma_key(img: Image.Image, key: tuple[int, int, int], tolerance: int = 60) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    soft = tolerance + 30
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


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
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


def fit_frame(img: Image.Image, size: int = FRAME_SIZE) -> Image.Image:
    """Contain into size×size canvas, bottom-centered (scales stand on floor)."""
    img = img.copy()
    img.thumbnail((size - 4, size - 4), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - img.width) // 2
    y = size - img.height - 2  # sit near bottom
    canvas.paste(img, (x, y), img)
    return canvas


def process(path: Path) -> Image.Image:
    raw = Image.open(path)
    keyed = chroma_key(raw, sample_key(raw))
    return fit_frame(trim(keyed))


def main() -> None:
    frames: list[Image.Image] = []
    for name in FRAMES:
        src = RAW / name
        if not src.exists():
            raise SystemExit(f"Missing frame: {src}")
        frame = process(src)
        frames.append(frame)
        # also save individual transparent frames for debugging
        solo = ROOT / "public" / "pixel" / f"scales-frame-{len(frames):02d}.png"
        frame.save(solo, "PNG")
        print(f"OK {name} -> {solo.name}")

    sheet = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * FRAME_SIZE, 0), fr)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, "PNG")
    meta = OUT.with_suffix(".json")
    meta.write_text(
        f'{{"frameWidth":{FRAME_SIZE},"frameHeight":{FRAME_SIZE},"frameCount":{len(frames)},'
        f'"sequence":"center-right-heavyR-right-center-left-heavyL-left","source":"image-gen"}}\n',
        encoding="utf-8",
    )
    print(f"Sheet -> {OUT} size={sheet.size}")


if __name__ == "__main__":
    main()
