"""
Pixel-perfect justice scales sprite sheet.
ONE drawing function; only the tip amount changes — every frame is the same art.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "pixel" / "scales-weigh-sheet.png"
OUT_DIR = ROOT / "public" / "pixel"

W = H = 128
# tip px: + = right pan down. Loop center→R→C→L
TIPS = [0, 6, 12, 6, 0, -6, -12, -6]

BG = (0, 0, 0, 0)
OUTLINE = (0, 0, 0, 255)
GOLD = (255, 210, 40, 255)
GOLD_D = (200, 140, 0, 255)
GOLD_L = (255, 240, 150, 255)
METAL = (186, 196, 210, 255)
METAL_D = (110, 120, 138, 255)
METAL_L = (230, 236, 245, 255)
WOOD = (92, 54, 28, 255)
WOOD_L = (140, 88, 42, 255)
WOOD_D = (60, 34, 16, 255)
CYAN = (0, 230, 255, 255)
CYAN_D = (0, 150, 190, 255)
PINK = (255, 40, 140, 255)
PINK_D = (190, 0, 90, 255)
CHAIN = (40, 40, 55, 255)


def put(px, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = c


def rect(px, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(px, x, y, c)


def hline(px, x0, x1, y, c):
    for x in range(min(x0, x1), max(x0, x1) + 1):
        put(px, x, y, c)


def vline(px, x, y0, y1, c):
    for y in range(min(y0, y1), max(y0, y1) + 1):
        put(px, x, y, c)


def outline_rect(px, x0, y0, x1, y1, c=OUTLINE):
    hline(px, x0, x1, y0, c)
    hline(px, x0, x1, y1, c)
    vline(px, x0, y0, y1, c)
    vline(px, x1, y0, y1, c)


def draw_pan(px, cx: int, top: int, fill, fill_d):
    """Bowl hanging from (cx, top) attachment."""
    # chains — always vertical (gravity)
    for dy in range(0, 14):
        put(px, cx - 7, top + dy, CHAIN)
        put(px, cx + 7, top + dy, CHAIN)
        if dy % 3 == 0:
            put(px, cx - 7, top + dy, METAL_D)
            put(px, cx + 7, top + dy, METAL_D)
    hline(px, cx - 7, cx + 7, top + 13, CHAIN)

    by = top + 14
    # bowl body — identical shape every call
    rect(px, cx - 12, by, cx + 12, by + 2, fill)
    rect(px, cx - 11, by + 3, cx + 11, by + 5, fill)
    rect(px, cx - 9, by + 6, cx + 9, by + 7, fill_d)
    outline_rect(px, cx - 12, by, cx + 12, by + 2)
    put(px, cx - 12, by + 3, OUTLINE)
    put(px, cx + 12, by + 3, OUTLINE)
    put(px, cx - 11, by + 5, OUTLINE)
    put(px, cx + 11, by + 5, OUTLINE)
    hline(px, cx - 9, cx + 9, by + 8, OUTLINE)
    # rim highlight
    hline(px, cx - 10, cx + 10, by + 1, fill if fill == CYAN else PINK)


def draw_scales(tip: int) -> Image.Image:
    img = Image.new("RGBA", (W, H), BG)
    px = img.load()
    cx = W // 2

    # ---- FIXED BASE (identical every frame) ----
    base_y = 108
    rect(px, cx - 28, base_y, cx + 28, base_y + 6, WOOD)
    rect(px, cx - 26, base_y + 1, cx + 26, base_y + 5, WOOD_L)
    rect(px, cx - 22, base_y - 4, cx + 22, base_y - 1, WOOD_D)
    rect(px, cx - 20, base_y - 3, cx + 20, base_y - 1, WOOD)
    outline_rect(px, cx - 28, base_y, cx + 28, base_y + 6)
    outline_rect(px, cx - 22, base_y - 4, cx + 22, base_y - 1)

    # ---- FIXED PILLAR ----
    pillar_top = 34
    rect(px, cx - 5, pillar_top, cx + 5, base_y - 5, METAL_D)
    rect(px, cx - 4, pillar_top, cx + 4, base_y - 5, METAL)
    vline(px, cx - 1, pillar_top, base_y - 5, METAL_L)
    outline_rect(px, cx - 5, pillar_top, cx + 5, base_y - 5)

    # fulcrum jewel
    fy = 36
    rect(px, cx - 6, fy - 4, cx + 6, fy + 6, GOLD_D)
    rect(px, cx - 5, fy - 3, cx + 5, fy + 5, GOLD)
    put(px, cx, fy, GOLD_L)
    outline_rect(px, cx - 6, fy - 4, cx + 6, fy + 6)

    # top ornament
    rect(px, cx - 2, 22, cx + 2, 32, GOLD)
    put(px, cx, 20, GOLD_L)
    put(px, cx, 21, GOLD)

    # ---- BEAM (tips) ----
    # ends move by ±tip; beam drawn as stepped line — same thickness always
    left_x, right_x = cx - 44, cx + 44
    left_y = fy - tip
    right_y = fy + tip

    steps = right_x - left_x
    for i in range(steps + 1):
        t = i / steps
        x = left_x + i
        y = int(round(left_y + (right_y - left_y) * t))
        for dy in (-2, -1, 0, 1, 2):
            col = GOLD if dy in (0, -1) else GOLD_D
            put(px, x, y + dy, col)
        put(px, x, y - 3, OUTLINE)
        put(px, x, y + 3, OUTLINE)

    # end caps — identical boxes
    for ex, ey in ((left_x, left_y), (right_x, right_y)):
        rect(px, ex - 3, ey - 4, ex + 3, ey + 4, GOLD)
        outline_rect(px, ex - 3, ey - 4, ex + 3, ey + 4)

    # ---- PANS (same draw_pan, different Y) ----
    # hang from beam ends; extra drop when that side is heavy
    left_attach = left_y + 4
    right_attach = right_y + 4
    draw_pan(px, left_x, left_attach, CYAN, CYAN_D)
    draw_pan(px, right_x, right_attach, PINK, PINK_D)

    # weight nugget on heavy side
    if tip >= 10:
        wx, wy = right_x, right_attach + 14
        rect(px, wx - 4, wy - 6, wx + 4, wy - 2, GOLD)
        outline_rect(px, wx - 4, wy - 6, wx + 4, wy - 2)
    if tip <= -10:
        wx, wy = left_x, left_attach + 14
        rect(px, wx - 4, wy - 6, wx + 4, wy - 2, GOLD)
        outline_rect(px, wx - 4, wy - 6, wx + 4, wy - 2)

    return img


def main() -> None:
    frames = [draw_scales(t) for t in TIPS]
    sheet = Image.new("RGBA", (W * len(frames), H), BG)
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * W, 0), fr)
        fr.save(OUT_DIR / f"scales-frame-{i + 1:02d}.png", "PNG")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, "PNG")
    OUT.with_suffix(".json").write_text(
        f'{{"frameWidth":{W},"frameHeight":{H},"frameCount":{len(frames)},'
        f'"method":"locked-geometry","tips":{TIPS}}}\n',
        encoding="utf-8",
    )
    print(f"OK {OUT} frames={len(frames)} tips={TIPS}")


if __name__ == "__main__":
    main()
