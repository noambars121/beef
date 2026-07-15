"""
Split a one-shot generated scales sprite sheet into consistent frames.
Source already draws the SAME scales tipped differently — so frames match.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(r"C:\Users\\Noam\\.cursor\\projects\\c-Dev-ActiveProjects-monard-judge\\assets")
SRC = RAW / "raw-scales-sheet-oneshot.png"
OUT_SHEET = ROOT / "public" / "pixel" / "scales-weigh-sheet.png"
OUT_DIR = ROOT / "public" / "pixel"

FRAME_SIZE = 128
# 6 source cells -> expand to 8-frame weigh loop
# cells: 0 center, 1 slight R, 2 heavy R, 3 slight L, 4 mid L, 5 heavy L
LOOP_ORDER = [0, 1, 2, 1, 0, 3, 5, 3]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def sample_key(img: Image.Image) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    pts = [
        rgb.getpixel((6, 6)),
        rgb.getpixel((rgb.width // 2, 6)),
        rgb.getpixel((rgb.width - 7, 6)),
        rgb.getpixel((6, rgb.height - 7)),
    ]
    return (
        sum(p[0] for p in pts) // 4,
        sum(p[1] for p in pts) // 4,
        sum(p[2] for p in pts) // 4,
    )


def chroma_key(img: Image.Image, key: tuple[int, int, int], tolerance: int = 58) -> Image.Image:
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


def fit(img: Image.Image, size: int = FRAME_SIZE) -> Image.Image:
    img = img.copy()
    img.thumbnail((size - 2, size - 2), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - img.width) // 2
    y = size - img.height - 1
    canvas.paste(img, (x, y), img)
    return canvas


def split_equal(img: Image.Image, count: int = 6) -> list[Image.Image]:
    w, h = img.size
    cell_w = w // count
    frames = []
    for i in range(count):
        cell = img.crop((i * cell_w, 0, (i + 1) * cell_w, h))
        frames.append(cell)
    return frames


def main() -> None:
    raw = Image.open(SRC)
    key = sample_key(raw)
    print(f"key={key} src={raw.size}")
    keyed = chroma_key(raw, key)

    cells = split_equal(keyed, 6)
    normalized: list[Image.Image] = []
    for i, cell in enumerate(cells):
        fr = fit(trim(cell))
        normalized.append(fr)
        path = OUT_DIR / f"scales-frame-{i + 1:02d}.png"
        fr.save(path, "PNG")
        print(f"cell {i} -> {path.name} {fr.size}")

    loop_frames = [normalized[i] for i in LOOP_ORDER]
    sheet = Image.new("RGBA", (FRAME_SIZE * len(loop_frames), FRAME_SIZE), (0, 0, 0, 0))
    for i, fr in enumerate(loop_frames):
        sheet.paste(fr, (i * FRAME_SIZE, 0), fr)

    OUT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_SHEET, "PNG")
    meta = OUT_SHEET.with_suffix(".json")
    meta.write_text(
        f'{{"frameWidth":{FRAME_SIZE},"frameHeight":{FRAME_SIZE},"frameCount":{len(loop_frames)},'
        f'"source":"oneshot-sheet","loop":"C-R-Rh-R-C-L-Lh-L"}}\n',
        encoding="utf-8",
    )
    print(f"sheet -> {OUT_SHEET} {sheet.size}")


if __name__ == "__main__":
    main()
