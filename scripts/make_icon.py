#!/usr/bin/env python3
"""Generate images/icon.png (128x128) for the Claude Token Monitor extension.

Draws a rounded-square with a purple->coral gradient and a segmented bar
gauge (matching the extension's ██░░ status bar look). Rendered at 4x and
downscaled for smooth antialiased edges.
"""
import os
from PIL import Image, ImageDraw

S = 512                      # supersample canvas
OUT = 128                    # final size
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_path = os.path.join(here, "images", "icon.png")


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


# --- vertical gradient background ---
top = (124, 92, 214)     # purple  #7c5cd6
bot = (217, 119, 87)     # coral    #d97757  (Claude-ish)
grad = Image.new("RGB", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    gd.line([(0, y), (S, y)], fill=lerp(top, bot, y / (S - 1)))

# --- rounded-square mask ---
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=112, fill=255)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)

# --- two stacked bar gauges (like ██████░░ status bar rows) ---
def bar_row(y0, bar_h, segs, filled):
    margin = 92
    gap = 20
    bar_w = S - 2 * margin
    seg_w = (bar_w - gap * (segs - 1)) / segs
    r = bar_h / 2
    for i in range(segs):
        x0 = margin + i * (seg_w + gap)
        box = [x0, y0, x0 + seg_w, y0 + bar_h]
        col = (255, 255, 255, 255) if i < filled else (255, 255, 255, 75)
        d.rounded_rectangle(box, radius=r, fill=col)

bh = 74
bar_row(y0=150, bar_h=bh, segs=6, filled=4)   # top row  (context)
bar_row(y0=288, bar_h=bh, segs=6, filled=2)   # bottom row (today)

# --- downscale ---
icon = img.resize((OUT, OUT), Image.LANCZOS)
os.makedirs(os.path.dirname(out_path), exist_ok=True)
icon.save(out_path, "PNG")
print("wrote", out_path, icon.size)
