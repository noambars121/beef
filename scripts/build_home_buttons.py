"""
Build matching home CTA buttons + keep normalized stats.
Buttons are locked-geometry twins (same size/style, different border + label).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(r"C:\Users\Noam\.cursor\projects\c-Dev-ActiveProjects-monard-judge\assets")
OUT = ROOT / "public" / "pixel"

BUTTON_SIZE = (320, 96)
STAT_SIZE = (140, 140)

# 5x7 pixel font for arcade labels
FONT = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "M": ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
}

PINK = (255, 0, 127, 255)
CYAN = (0, 240, 255, 255)
YELLOW = (255, 230, 0, 255)
YELLOW_D = (180, 140, 0, 255)
BLACK = (0, 0, 0, 255)
OUTLINE = (0, 0, 0, 255)


def put(px, x, y, c, w, h):
    if 0 <= x < w and 0 <= y < h:
        px[x, y] = c


def draw_rect(px, x0, y0, x1, y1, c, w, h):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(px, x, y, c, w, h)


def draw_border(px, x0, y0, x1, y1, c, w, h, thick=4):
    for t in range(thick):
        # top/bottom
        for x in range(x0 + t, x1 - t + 1):
            put(px, x, y0 + t, c, w, h)
            put(px, x, y1 - t, c, w, h)
        # sides
        for y in range(y0 + t, y1 - t + 1):
            put(px, x0 + t, y, c, w, h)
            put(px, x1 - t, y, c, w, h)
    # stepped corners cut
    for t in range(2):
        put(px, x0 + t, y0, (0, 0, 0, 0), w, h)
        put(px, x0, y0 + t, (0, 0, 0, 0), w, h)
        put(px, x1 - t, y0, (0, 0, 0, 0), w, h)
        put(px, x1, y0 + t, (0, 0, 0, 0), w, h)
        put(px, x0 + t, y1, (0, 0, 0, 0), w, h)
        put(px, x0, y1 - t, (0, 0, 0, 0), w, h)
        put(px, x1 - t, y1, (0, 0, 0, 0), w, h)
        put(px, x1, y1 - t, (0, 0, 0, 0), w, h)


def draw_char(px, ch, ox, oy, color, shadow, scale, w, h):
    pattern = FONT.get(ch, FONT[" "])
    for row, bits in enumerate(pattern):
        for col, bit in enumerate(bits):
            if bit == "1":
                for sy in range(scale):
                    for sx in range(scale):
                        put(px, ox + col * scale + sx + 1, oy + row * scale + sy + 1, shadow, w, h)
                        put(px, ox + col * scale + sx, oy + row * scale + sy, color, w, h)


def draw_text(px, text: str, cx: int, cy: int, color, shadow, scale, w, h):
    char_w = 5 * scale + scale  # glyph + gap
    total = len(text) * char_w - scale
    x = cx - total // 2
    y = cy - (7 * scale) // 2
    for ch in text:
        draw_char(px, ch, x, y, color, shadow, scale, w, h)
        x += char_w


def make_button(label: str, border) -> Image.Image:
    w, h = BUTTON_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    # fill
    draw_rect(px, 4, 4, w - 5, h - 5, BLACK, w, h)
    # outer black outline
    draw_border(px, 0, 0, w - 1, h - 1, OUTLINE, w, h, thick=2)
    # colored border
    draw_border(px, 2, 2, w - 3, h - 3, border, w, h, thick=4)
    # text — same glyph scale on both buttons for visual match
    draw_text(px, label, w // 2, h // 2, YELLOW, YELLOW_D, 2, w, h)
    return img


def color_distance(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def sample_key(img: Image.Image):
    rgb = img.convert("RGB")
    pts = [rgb.getpixel((4, 4)), rgb.getpixel((rgb.width - 5, 4))]
    return tuple(sum(p[i] for p in pts) // len(pts) for i in range(3))


def chroma_key(img: Image.Image, key, tolerance=55):
    rgba = img.convert("RGBA")
    px = rgba.load()
    soft = tolerance + 28
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            dist = color_distance((r, g, b), key)
            if dist <= tolerance:
                px[x, y] = (0, 0, 0, 0)
            elif dist < soft:
                fade = int(255 * (dist - tolerance) / (soft - tolerance))
                px[x, y] = (r, g, b, min(a, fade))
    return rgba


def trim(img: Image.Image, pad=4):
    bbox = img.split()[-1].getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


def fit_exact(img: Image.Image, size):
    tw, th = size
    img = img.copy()
    img.thumbnail((tw, th), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.paste(img, ((tw - img.width) // 2, (th - img.height) // 2), img)
    return canvas


def process_stat(raw_name: str, out_name: str):
    src = RAW / raw_name
    keyed = chroma_key(Image.open(src), sample_key(Image.open(src)))
    final = fit_exact(trim(keyed), STAT_SIZE)
    final.save(OUT / out_name, "PNG", optimize=True)
    print(f"OK stat {out_name} {final.size}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    insert = make_button("INSERT CASE", PINK)
    hall = make_button("HALL OF SHAME", CYAN)
    insert.save(OUT / "btn-insert-case.png", "PNG")
    hall.save(OUT / "btn-hall-shame.png", "PNG")
    print(f"OK buttons {BUTTON_SIZE}")

    process_stat("raw-stat-players-v2.png", "stat-players.png")
    process_stat("raw-stat-verdict-v2.png", "stat-verdict.png")
    process_stat("raw-stat-mercy-v2.png", "stat-mercy.png")


if __name__ == "__main__":
    main()
