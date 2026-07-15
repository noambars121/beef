"""
Build a consistent scales sprite sheet from ONE master image.

Base + pillar stay locked. Only the beam+pans layer rotates around the fulcrum
so every frame is the same art, just tipped.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(r"C:\Users\Noam\.cursor\projects\c-Dev-ActiveProjects-monard-judge\assets")
MASTER = RAW / "raw-scales-master.png"
OUT_SHEET = ROOT / "public" / "pixel" / "scales-weigh-sheet.png"
OUT_DIR = ROOT / "public" / "pixel"

FRAME = 128
# tip degrees: center -> R -> heavy R -> R -> center -> L -> heavy L -> L
ANGLES = [0, 8, 16, 8, 0, -8, -16, -8]


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


def trim(img: Image.Image, pad: int = 6) -> Image.Image:
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


def fit_square(img: Image.Image, size: int = FRAME) -> Image.Image:
    img = img.copy()
    img.thumbnail((size - 4, size - 4), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - img.width) // 2
    y = size - img.height - 2
    canvas.paste(img, (x, y), img)
    return canvas


def find_fulcrum(img: Image.Image) -> tuple[int, int, int]:
    """
    Fulcrum ≈ top-most gold-ish cluster center.
    Also return split_y where base/pillar should stay fixed (below beam).
    """
    px = img.load()
    w, h = img.size
    gold_pts: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            # gold / yellow beam
            if r > 180 and g > 140 and b < 120 and r >= g:
                gold_pts.append((x, y))

    if not gold_pts:
        return w // 2, int(h * 0.28), int(h * 0.42)

    # fulcrum near horizontal center of gold, vertically near top of gold band
    xs = [p[0] for p in gold_pts]
    ys = [p[1] for p in gold_pts]
    # prefer gold near image center X
    cx = w // 2
    near = [p for p in gold_pts if abs(p[0] - cx) < w * 0.12]
    if not near:
        near = gold_pts
    fx = sum(p[0] for p in near) // len(near)
    fy = min(p[1] for p in near) + 8

    split_y = max(ys) + 4  # below lowest gold = start of fixed zone (approx)
    split_y = min(max(split_y, fy + 10), h - 20)
    return fx, fy, split_y


def make_movable_mask(img: Image.Image, split_y: int) -> Image.Image:
    """
    Movable = opaque pixels in the upper region (beam + pans + chains).
    Keep a vertical pillar strip in the upper region fixed by punching a hole
    around center so pillar doesn't tilt.
    """
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    src = img.split()[-1]
    # upper content
    mask.paste(src.crop((0, 0, w, split_y)), (0, 0))

    # punch out central pillar strip so it stays with the fixed layer
    draw = ImageDraw.Draw(mask)
    cx = w // 2
    pillar_half = max(6, w // 18)
    draw.rectangle([cx - pillar_half, 0, cx + pillar_half, split_y], fill=0)
    return mask


def extract_layer(img: Image.Image, mask: Image.Image) -> Image.Image:
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def fixed_layer(img: Image.Image, movable_mask: Image.Image) -> Image.Image:
    """Everything except movable pixels."""
    inv = movable_mask.point(lambda v: 0 if v > 0 else 255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), inv)
    # also keep movable-masked-out as transparent already
    return out


def rotate_around(img: Image.Image, angle: float, cx: int, cy: int) -> Image.Image:
    """Rotate RGBA image around (cx,cy), keep same canvas size."""
    # Expand, rotate, then crop back so pivot stays put
    w, h = img.size
    # PIL rotates around image center — translate so fulcrum -> center
    diag = int(math.ceil(math.hypot(w, h))) + 4
    pad = Image.new("RGBA", (diag, diag), (0, 0, 0, 0))
    ox = diag // 2 - cx
    oy = diag // 2 - cy
    pad.paste(img, (ox, oy), img)
    rotated = pad.rotate(-angle, resample=Image.Resampling.NEAREST, expand=False)
    # crop back to original frame with fulcrum at (cx,cy)
    left = diag // 2 - cx
    top = diag // 2 - cy
    return rotated.crop((left, top, left + w, top + h))


def render_frame(base: Image.Image, movable: Image.Image, angle: float, fx: int, fy: int) -> Image.Image:
    tipped = rotate_around(movable, angle, fx, fy) if angle != 0 else movable
    frame = Image.new("RGBA", base.size, (0, 0, 0, 0))
    frame.alpha_composite(base)
    frame.alpha_composite(tipped)
    return frame


def main() -> None:
    raw = Image.open(MASTER)
    keyed = chroma_key(raw, sample_key(raw))
    master = fit_square(trim(keyed), FRAME)

    fx, fy, split_y = find_fulcrum(master)
    print(f"fulcrum=({fx},{fy}) split_y={split_y}")

    mov_mask = make_movable_mask(master, split_y)
    movable = extract_layer(master, mov_mask)
    base = fixed_layer(master, mov_mask)

    # Save debug layers
    base.save(OUT_DIR / "scales-layer-base.png", "PNG")
    movable.save(OUT_DIR / "scales-layer-movable.png", "PNG")

    frames: list[Image.Image] = []
    for i, ang in enumerate(ANGLES):
        fr = render_frame(base, movable, float(ang), fx, fy)
        frames.append(fr)
        fr.save(OUT_DIR / f"scales-frame-{i + 1:02d}.png", "PNG")
        print(f"frame {i + 1}: angle={ang}")

    sheet = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * FRAME, 0), fr)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_SHEET, "PNG")
    OUT_SHEET.with_suffix(".json").write_text(
        f'{{"frameWidth":{FRAME},"frameHeight":{FRAME},"frameCount":{len(frames)},'
        f'"source":"master-rotate","angles":{ANGLES}}}\n',
        encoding="utf-8",
    )
    print(f"sheet -> {OUT_SHEET} {sheet.size}")


if __name__ == "__main__":
    main()
