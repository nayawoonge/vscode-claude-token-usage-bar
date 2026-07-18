#!/usr/bin/env python3
"""Generate images/screenshot.png — a clean illustration of the status bar item.

Draws a VS Code-style status bar strip with the extension's item on the right:
a segmented context gauge + "% used" and today's cumulative tokens.
Rendered at 2x and downscaled for crisp edges.
"""
import os
from PIL import Image, ImageDraw, ImageFont

S = 2                      # supersample factor
W, H = 900 * S, 52 * S
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(here, "images", "screenshot.png")

FONT = "/System/Library/Fonts/Helvetica.ttc"
def font(sz):
    try:
        return ImageFont.truetype(FONT, sz * S)
    except Exception:
        return ImageFont.load_default()

img = Image.new("RGB", (W, H), (24, 28, 36))     # status-bar background
d = ImageDraw.Draw(img)
d.line([(0, 0), (W, 0)], fill=(45, 51, 62), width=S)   # subtle top border

white = (235, 238, 242)
dim = (150, 158, 170)
accent = (124, 152, 214)

f = font(13)
fb = font(13)

# --- build the right-aligned group, measured right-to-left ---
pad = 18 * S
x = W - pad

def text_w(s, ft):
    return d.textbbox((0, 0), s, font=ft)[2]

# today part (rightmost)
today = "Today 1.24M tok"
x -= text_w(today, f)
today_x = x
# chart glyph before it
gap = 8 * S

# separator
sep = "  ·  "
# context part text
pct = "61% used"

# We lay out left-to-right instead for simplicity; compute total width first.
segs, filled = 12, 7
seg_w, seg_h, seg_gap = 7 * S, 15 * S, 3 * S
bar_w = segs * seg_w + (segs - 1) * seg_gap

label = "Context"
total = (
    text_w(label, fb) + gap + bar_w + gap + text_w(pct, f)
    + text_w(sep, f) + text_w(today, f)
)
x = W - pad - total
cy = H // 2

# label
d.text((x, cy), label, font=fb, fill=white, anchor="lm")
x += text_w(label, fb) + gap
# gauge
by = cy - seg_h // 2
for i in range(segs):
    box = [x, by, x + seg_w, by + seg_h]
    r = seg_h // 2
    d.rounded_rectangle(box, radius=r, fill=white if i < filled else (70, 78, 92))
    x += seg_w + seg_gap
x += gap - seg_gap
# percent
d.text((x, cy), pct, font=f, fill=white, anchor="lm")
x += text_w(pct, f)
# separator
d.text((x, cy), sep, font=f, fill=dim, anchor="lm")
x += text_w(sep, f)
# today
d.text((x, cy), today, font=f, fill=accent, anchor="lm")

# left side: a faint hint of other status-bar items
d.text((pad, cy), "main      0 errors, 0 warnings", font=font(12), fill=(90, 98, 112), anchor="lm")

img = img.resize((W // S, H // S), Image.LANCZOS)
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, "PNG")
print("wrote", out, img.size)
